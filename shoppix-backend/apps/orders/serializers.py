from rest_framework import serializers

from apps.accounts.serializers import ShippingAddressSerializer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    sub_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    product_thumbnail = serializers.ImageField(source="product.thumbnail", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "product_thumbnail", "vendor",
            "quantity", "price_per_item", "sub_total", "fulfillment_status",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "status", "order_items", "amount", "order_reference",
            "payment_reference", "shipping_address", "created_at", "updated_at",
        ]
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()


class VendorOrderItemSerializer(serializers.ModelSerializer):
    """What a vendor sees when browsing orders containing their products —
    scoped to just their own line items, never the full order/customer order total."""

    order_reference = serializers.CharField(source="order.order_reference", read_only=True)
    order_status = serializers.CharField(source="order.status", read_only=True)
    customer_email = serializers.CharField(source="order.user.email", read_only=True)
    sub_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    vendor_earning = serializers.FloatField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "order_reference", "order_status", "customer_email", "product_name",
            "quantity", "price_per_item", "sub_total", "vendor_earning", "fulfillment_status",
        ]
        read_only_fields = fields
