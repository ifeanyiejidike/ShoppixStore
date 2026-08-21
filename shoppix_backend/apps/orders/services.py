"""
Order business logic lives here rather than in views/serializers, so it can
be reused by the checkout endpoint, admin actions, and management commands
without duplicating the transaction/locking logic.
"""
from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from apps.catalog.models import Product
from apps.cart.models import Cart

from .models import Order, OrderItem, OrderStatus


class CheckoutError(ValidationError):
    pass


@transaction.atomic
def checkout_cart(*, user, shipping_address=None) -> Order:
    """
    Converts the user's cart into an Order:
      1. Locks the relevant product rows (select_for_update) to avoid two
         simultaneous checkouts overselling the same stock.
      2. Validates stock is still sufficient (it may have changed since the
         item was added to the cart).
      3. Snapshots product name/price/commission onto OrderItem so later
         price or vendor-rate changes never retroactively alter past orders.
      4. Decrements stock immediately (reserved at order-creation time, not
         at payment-confirmation time) and empties the cart.
    """
    try:
        cart = Cart.objects.select_related("user").get(user=user)
    except Cart.DoesNotExist:
        raise CheckoutError("Your cart is empty.")

    cart_items = list(cart.cart_items.select_related("product", "product__vendor"))
    if not cart_items:
        raise CheckoutError("Your cart is empty.")

    product_ids = [item.product_id for item in cart_items]
    locked_products = {p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)}

    for item in cart_items:
        product = locked_products[item.product_id]
        if not product.is_active:
            raise CheckoutError(f"'{product.name}' is no longer available.")
        if item.quantity > product.stock:
            raise CheckoutError(f"Only {product.stock} unit(s) of '{product.name}' left in stock.")

    order = Order.objects.create(user=user, shipping_address=shipping_address, amount=0)

    for item in cart_items:
        product = locked_products[item.product_id]
        OrderItem.objects.create(
            order=order,
            product=product,
            vendor=product.vendor,
            product_name=product.name,
            quantity=item.quantity,
            price_per_item=product.current_price,
            commission_rate=product.vendor.commission_rate,
            fulfillment_status=OrderStatus.PENDING_PAYMENT,
        )
        product.stock = product.stock - item.quantity
        product.save(update_fields=["stock"])

    order.recalculate_amount()
    order.save(update_fields=["amount"])

    cart.cart_items.all().delete()
    return order


@transaction.atomic
def mark_order_paid(order: Order, payment_reference: str) -> Order:
    """Called from the payment-verification flow (webhook or manual verify)."""
    if order.status == OrderStatus.PAID:
        return order  # idempotent — webhooks can fire more than once

    order.status = OrderStatus.PAID
    order.payment_reference = payment_reference
    order.save(update_fields=["status", "payment_reference"])
    order.order_items.update(fulfillment_status=OrderStatus.PAID)

    # Credit each vendor's running sales total for their portion of this order.
    from apps.vendors.models import Vendor

    for item in order.order_items.select_related("vendor"):
        Vendor.objects.filter(pk=item.vendor_id).update(
            total_sales_ever=F("total_sales_ever") + item.sub_total
        )
    return order


@transaction.atomic
def cancel_order(order: Order) -> Order:
    """Restocks products and cancels an order still awaiting payment."""
    if order.status not in [OrderStatus.PENDING_PAYMENT]:
        raise CheckoutError("Only orders pending payment can be cancelled.")

    for item in order.order_items.select_related("product"):
        Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)

    order.status = OrderStatus.CANCELLED
    order.save(update_fields=["status"])
    order.order_items.update(fulfillment_status=OrderStatus.CANCELLED)
    return order

