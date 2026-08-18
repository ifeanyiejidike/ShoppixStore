from django.contrib import admin

from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "vendor", "category", "current_price", "stock", "is_active", "is_on_flash_sales"]
    list_filter = ["is_active", "is_on_flash_sales", "category"]
    search_fields = ["name", "vendor__brand_name"]
    inlines = [ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
