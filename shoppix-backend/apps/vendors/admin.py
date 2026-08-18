from django.contrib import admin

from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ["brand_name", "user", "is_activated", "is_diamond", "commission_rate", "total_sales_ever", "created_at"]
    list_filter = ["is_activated", "is_diamond"]
    search_fields = ["brand_name", "user__email", "email"]
    actions = ["approve_vendors"]

    @admin.action(description="Approve selected vendors")
    def approve_vendors(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_activated=True, activated_at=timezone.now())
