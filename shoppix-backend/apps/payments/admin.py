from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["payment_reference", "user", "order", "amount", "payment_method", "payment_status", "is_verified"]
    list_filter = ["payment_method", "payment_status", "is_verified"]
    search_fields = ["payment_reference", "user__email", "order__order_reference"]
