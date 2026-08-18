from rest_framework import serializers

from apps.vendors.serializers import VendorSerializer

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "image", "is_active"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "sort_order"]


class ProductSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True, required=False, allow_null=True
    )
    images = ProductImageSerializer(many=True, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    percentage_difference = serializers.FloatField(read_only=True)
    is_flash_sale_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "vendor", "category", "category_id", "name", "slug", "description",
            "stock", "current_price", "old_price", "thumbnail", "images",
            "is_active", "is_on_flash_sales", "flash_sale_ends_at",
            "is_in_stock", "is_flash_sale_active", "percentage_difference",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "vendor", "slug", "created_at", "updated_at"]

    def validate(self, attrs):
        old_price = attrs.get("old_price", getattr(self.instance, "old_price", None))
        current_price = attrs.get("current_price", getattr(self.instance, "current_price", None))
        if old_price is not None and current_price is not None and old_price < current_price:
            raise serializers.ValidationError(
                {"old_price": "Old price should be greater than the current price for a discount to make sense."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["vendor"] = self.context["request"].user.vendor
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """Lighter payload for grid/listing pages."""

    vendor_name = serializers.CharField(source="vendor.brand_name", read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    percentage_difference = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "vendor_name", "current_price", "old_price",
            "thumbnail", "is_in_stock", "is_on_flash_sales", "percentage_difference",
        ]
