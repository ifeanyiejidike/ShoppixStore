import uuid

from django.conf import settings
from django.db import models


def vendor_avatar_path(instance, filename):
    return f"vendors/{instance.id}/avatar/{filename}"


class Vendor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="vendor", on_delete=models.CASCADE)
    email = models.EmailField(help_text="Public/brand contact email, may differ from login email.")
    brand_name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    avatar = models.ImageField(upload_to=vendor_avatar_path, null=True, blank=True)

    is_activated = models.BooleanField(default=False, help_text="Approved by admin to sell.")
    activated_at = models.DateTimeField(null=True, blank=True)
    is_diamond = models.BooleanField(default=False, help_text="Top-tier vendor badge.")

    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=settings.DEFAULT_VENDOR_COMMISSION_RATE,
        help_text="Platform commission percentage taken from each sale.",
    )
    total_sales_ever = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.brand_name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(self.brand_name)
            slug = base
            n = 1
            while Vendor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def net_earning_rate(self):
        return 100 - float(self.commission_rate)
