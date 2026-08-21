import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("apps.common")


def custom_exception_handler(exc, context):
    """Wrap DRF's default handler so every error response has a consistent
    shape: {"detail": ..., "code": ...}. Unhandled exceptions are logged
    with the request id for traceability instead of leaking a stack trace.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        response.data["status_code"] = response.status_code
        return response

    request = context.get("request")
    request_id = getattr(request, "request_id", "-")
    logger.exception("Unhandled exception [request_id=%s]", request_id)
    return None
