from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "vendor", "product_name", "quantity", "price_per_item", "commission_rate"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_reference", "user", "status", "amount", "created_at"]
    list_filter = ["status"]
    search_fields = ["order_reference", "user__email", "payment_reference"]
    inlines = [OrderItemInline]
