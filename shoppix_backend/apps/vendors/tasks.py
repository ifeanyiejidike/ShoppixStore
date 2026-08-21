from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task
def notify_vendor_activation(vendor_id):
    from .models import Vendor

    try:
        vendor = Vendor.objects.select_related("user").get(pk=vendor_id)
    except Vendor.DoesNotExist:
        return
    send_mail(
        subject="Your Shoppix vendor account is approved 🎉",
        message=f"Hi {vendor.brand_name}, your vendor account has been approved. You can now list products.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[vendor.user.email],
    )
