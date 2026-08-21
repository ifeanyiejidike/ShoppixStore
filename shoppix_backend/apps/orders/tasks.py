import logging

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger("apps.orders")


@shared_task
def cancel_stale_orders():
    """
    Runs on a schedule (see CELERY_BEAT_SCHEDULE in settings). Finds orders
    still stuck in PENDING_PAYMENT past ORDER_PAYMENT_TIMEOUT_MINUTES —
    meaning the customer started checkout, reserved stock, and then either
    abandoned the gateway redirect or the payment never completed — and
    cancels them via the same cancel_order() service checkout uses, which
    restocks the reserved items.

    Deliberately re-fetches and cancels one order at a time inside its own
    transaction (via cancel_order's @transaction.atomic) rather than a bulk
    update, so a failure on one stale order never blocks the others.
    """
    from .models import Order, OrderStatus
    from .services import CheckoutError, cancel_order

    cutoff = timezone.now() - timezone.timedelta(minutes=settings.ORDER_PAYMENT_TIMEOUT_MINUTES)
    stale_orders = Order.objects.filter(status=OrderStatus.PENDING_PAYMENT, created_at__lt=cutoff)

    cancelled_count = 0
    for order in stale_orders:
        try:
            cancel_order(order)
            cancelled_count += 1
            logger.info("Auto-cancelled stale order %s (created %s)", order.order_reference, order.created_at)
        except CheckoutError as exc:
            # Order's status changed between the query and this loop
            # iteration (e.g. payment succeeded moments ago) — skip it.
            logger.info("Skipped auto-cancelling %s: %s", order.order_reference, exc.detail)

    return cancelled_count
