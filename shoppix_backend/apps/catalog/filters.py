import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="current_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="current_price", lookup_expr="lte")
    category = django_filters.CharFilter(field_name="category__slug")
    vendor = django_filters.CharFilter(field_name="vendor__slug")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    flash_sale = django_filters.BooleanFilter(field_name="is_on_flash_sales")

    class Meta:
        model = Product
        fields = ["category", "vendor", "min_price", "max_price", "in_stock", "flash_sale"]

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)
