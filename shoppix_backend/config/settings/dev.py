from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Local dev shouldn't hard-require a running Redis server. Docker/prod use
# real Redis (see base.py); here we fall back to in-memory cache so
# `python manage.py runserver` works standalone. Celery still needs Redis
# for async tasks, but CELERY_TASK_ALWAYS_EAGER=True in .env.example makes
# tasks run synchronously in-process for local dev too.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

INSTALLED_APPS += []  # room for debug_toolbar etc if added later
