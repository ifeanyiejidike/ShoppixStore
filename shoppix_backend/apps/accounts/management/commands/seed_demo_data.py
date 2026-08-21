from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import Category, Product
from apps.vendors.models import Vendor


class Command(BaseCommand):
    help = "Seed the database with demo users, vendors, categories and products for local development."

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            email="admin@shoppix.com",
            defaults={"is_staff": True, "is_superuser": True, "is_customer": False, "is_email_verified": True},
        )
        if created:
            admin.set_password("Admin@12345")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created superuser admin@shoppix.com / Admin@12345"))

        customer, created = User.objects.get_or_create(
            email="customer@shoppix.com", defaults={"is_email_verified": True}
        )
        if created:
            customer.set_password("Customer@12345")
            customer.save()

        vendor_user, created = User.objects.get_or_create(
            email="vendor@shoppix.com",
            defaults={"is_vendor": True, "is_customer": False, "is_email_verified": True},
        )
        if created:
            vendor_user.set_password("Vendor@12345")
            vendor_user.save()

        vendor, _ = Vendor.objects.get_or_create(
            user=vendor_user,
            defaults={
                "email": "vendor@shoppix.com",
                "brand_name": "TechHub Nigeria",
                "is_activated": True,
                "activated_at": timezone.now(),
            },
        )

        electronics, _ = Category.objects.get_or_create(name="Electronics")
        phones, _ = Category.objects.get_or_create(name="Phones", parent=electronics)

        Product.objects.get_or_create(
            vendor=vendor,
            name="Aurora X12 Smartphone",
            defaults={
                "category": phones,
                "description": "6.5-inch display, 128GB storage, dual SIM.",
                "stock": 50,
                "current_price": Decimal("185000.00"),
                "old_price": Decimal("220000.00"),
                "is_on_flash_sales": True,
            },
        )
        Product.objects.get_or_create(
            vendor=vendor,
            name="SoundWave Bluetooth Earbuds",
            defaults={
                "category": electronics,
                "description": "Noise-cancelling wireless earbuds, 30hr battery.",
                "stock": 120,
                "current_price": Decimal("15000.00"),
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
