from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Vendor


class VendorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = [
            "id", "user", "email", "brand_name", "slug", "description", "avatar",
            "is_activated", "is_diamond", "total_sales_ever", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "user", "slug", "is_activated", "is_diamond", "total_sales_ever",
            "created_at", "updated_at",
        ]


class VendorApplicationSerializer(serializers.ModelSerializer):
    """Used by a customer applying to become a vendor. Leaves is_activated
    False — an admin must approve via VendorApprovalView / Django admin."""

    class Meta:
        model = Vendor
        fields = ["id", "email", "brand_name", "description", "avatar", "is_activated", "created_at"]
        read_only_fields = ["id", "is_activated", "created_at"]

    def validate_brand_name(self, value):
        if Vendor.objects.filter(brand_name__iexact=value).exists():
            raise serializers.ValidationError("This brand name is already taken.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        vendor = Vendor.objects.create(user=user, **validated_data)
        user.is_vendor = True
        user.save(update_fields=["is_vendor"])
        return vendor
