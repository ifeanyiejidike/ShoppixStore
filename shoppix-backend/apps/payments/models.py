import uuid

from django.conf import settings
from django.db import models


class PaymentMethod(models.TextChoices):
    PAYSTACK = "paystack", "Paystack"
    OPAY = "opay", "Opay"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    SUCCESSFUL = "successful", "Successful"
    FAILED = "failed", "Failed"
    ABANDONED = "abandoned", "Abandoned"


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="payments", on_delete=models.CASCADE)
    order = models.ForeignKey("orders.Order", related_name="payments", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=14, decimal_places=2)

    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_reference = models.CharField(max_length=100, unique=True, db_index=True)
    gateway_response = models.JSONField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.payment_reference} ({self.payment_status})"
