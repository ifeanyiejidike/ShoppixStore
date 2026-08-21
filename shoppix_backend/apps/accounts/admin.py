from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import ShippingAddress, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "is_customer", "is_vendor", "is_active", "is_email_verified", "date_joined"]
    list_filter = ["is_customer", "is_vendor", "is_active", "is_email_verified"]
    search_fields = ["email"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Roles", {"fields": ("is_customer", "is_vendor")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "is_email_verified", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2", "is_customer", "is_vendor")}),
    )


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ["user", "first_name", "last_name", "state", "lga", "is_default"]
    search_fields = ["user__email", "first_name", "last_name", "phone"]
    list_filter = ["state"]
