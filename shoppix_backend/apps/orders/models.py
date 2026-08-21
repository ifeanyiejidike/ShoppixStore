import uuid

from django.conf import settings
from django.db import models


class OrderStatus(models.TextChoices):
    PENDING_PAYMENT = "pending_payment", "Pending Payment"
    PAID = "paid", "Paid"
    PROCESSING = "processing", "Processing"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"
    REFUNDED = "refunded", "Refunded"


def generate_order_reference():
    return f"SHX-{uuid.uuid4().hex[:10].upper()}"


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.CASCADE)
    shipping_address = models.ForeignKey(
        "accounts.ShippingAddress", null=True, blank=True, on_delete=models.SET_NULL
    )
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING_PAYMENT)

    amount = models.DecimalField(max_digits=14, decimal_places=2)
    order_reference = models.CharField(max_length=32, unique=True, default=generate_order_reference, editable=False)
    payment_reference = models.CharField(max_length=100, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "status"])]

    def __str__(self):
        return self.order_reference

    def recalculate_amount(self):
        self.amount = sum((item.sub_total for item in self.order_items.all()), start=0)


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, related_name="order_items", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", related_name="order_items", on_delete=models.PROTECT)
    vendor = models.ForeignKey("vendors.Vendor", related_name="order_items", on_delete=models.PROTECT)

    # Snapshot fields — never recompute from the live product, prices/names can change later.
    product_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    price_per_item = models.DecimalField(max_digits=12, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)

    fulfillment_status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING_PAYMENT,
        help_text="Per-vendor fulfillment status; Order.status is the overall/payment status.",
    )

    class Meta:
        ordering = ["id"]

    @property
    def sub_total(self):
        return self.price_per_item * self.quantity

    @property
    def vendor_earning(self):
        rate = (100 - float(self.commission_rate)) / 100
        return round(float(self.sub_total) * rate, 2)
