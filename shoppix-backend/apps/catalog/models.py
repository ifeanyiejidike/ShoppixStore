import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, related_name="children", on_delete=models.SET_NULL
    )
    image = models.ImageField(upload_to="categories/", null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


def product_thumbnail_path(instance, filename):
    return f"products/{instance.id}/{filename}"


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey("vendors.Vendor", related_name="products", on_delete=models.CASCADE)
    category = models.ForeignKey(
        Category, related_name="products", null=True, blank=True, on_delete=models.SET_NULL
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)

    stock = models.PositiveIntegerField(default=0)
    current_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    old_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    thumbnail = models.ImageField(upload_to=product_thumbnail_path, null=True, blank=True)

    is_active = models.BooleanField(default=True, help_text="Vendor/admin can hide without deleting.")
    is_on_flash_sales = models.BooleanField(default=False)
    flash_sale_ends_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active", "is_on_flash_sales"]),
            models.Index(fields=["vendor", "is_active"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = f"{base}-{str(self.id)[:8]}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_in_stock(self):
        return self.stock > 0

    @property
    def is_flash_sale_active(self):
        if not self.is_on_flash_sales:
            return False
        if self.flash_sale_ends_at and self.flash_sale_ends_at < timezone.now():
            return False
        return True

    @property
    def percentage_difference(self):
        if self.old_price and self.old_price > 0:
            diff = (self.old_price - self.current_price) / self.old_price * 100
            return round(float(diff), 2)
        return 0.0


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="products/gallery/")
    alt_text = models.CharField(max_length=150, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]
