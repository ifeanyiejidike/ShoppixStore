from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def send_order_confirmation_email(order_id):
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        return
    send_mail(
        subject=f"Order {order.order_reference} confirmed",
        message=(
            f"Thanks for your order! We've received payment of NGN {order.amount} "
            f"for order {order.order_reference}. We'll notify you as it ships."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.user.email],
    )


@shared_task
def notify_vendors_of_sale(order_id):
    from apps.orders.models import Order

    try:
        order = Order.objects.prefetch_related("order_items__vendor__user").get(pk=order_id)
    except Order.DoesNotExist:
        return
    vendors_notified = set()
    for item in order.order_items.all():
        if item.vendor_id in vendors_notified:
            continue
        vendors_notified.add(item.vendor_id)
        send_mail(
            subject=f"New sale on Shoppix — order {order.order_reference}",
            message=f"You have a new paid order to fulfill: {item.product_name} x{item.quantity}.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[item.vendor.user.email],
        )
