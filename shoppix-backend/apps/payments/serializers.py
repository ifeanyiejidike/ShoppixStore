from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "order", "amount", "payment_method", "payment_status",
            "payment_reference", "is_verified", "created_at", "updated_at",
        ]
        read_only_fields = fields


class InitializePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=["paystack", "opay"])
