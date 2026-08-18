from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_verification_email(self, user_id, uid, token):
    from .models import User

    try:
        user = User.objects.get(pk=user_id)
        link = f"{settings.FRONTEND_URL}/auth/verify-email?uid={uid}&token={token}"
        html = render_to_string("emails/verify_email.html", {"link": link, "user": user})
        send_mail(
            subject="Verify your Shoppix account",
            message=strip_tags(html),
            html_message=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_password_reset_email(self, user_id, uid, token):
    from .models import User

    try:
        user = User.objects.get(pk=user_id)
        link = f"{settings.FRONTEND_URL}/auth/reset?uid={uid}&token={token}"
        html = render_to_string("emails/reset_password.html", {"link": link, "user": user})
        send_mail(
            subject="Reset your Shoppix password",
            message=strip_tags(html),
            html_message=html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as exc:
        raise self.retry(exc=exc)
