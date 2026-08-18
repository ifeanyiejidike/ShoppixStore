from rest_framework import serializers

from apps.orders.models import OrderItem, OrderStatus

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    is_verified_purchase = serializers.BooleanField(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "user_email", "rating", "comment", "is_verified_purchase", "created_at"]
        read_only_fields = ["id", "user_email", "is_verified_purchase", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        product = attrs.get("product") or getattr(self.instance, "product", None)

        if Review.objects.filter(product=product, user=request.user).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError("You've already reviewed this product.")

        # Only when creating: reviewing requires a verified purchase. Editing
        # an existing review doesn't need to re-check this — the order_item
        # link set at creation time stands.
        if self.instance is None:
            order_item = OrderItem.objects.filter(
                product=product,
                order__user=request.user,
                order__status__in=[OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
            ).first()
            if order_item is None:
                raise serializers.ValidationError(
                    "You can only review products you've purchased. Reviews are limited to verified buyers."
                )
            attrs["_order_item"] = order_item

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        order_item = validated_data.pop("_order_item")
        return Review.objects.create(user=request.user, order_item=order_item, **validated_data)
