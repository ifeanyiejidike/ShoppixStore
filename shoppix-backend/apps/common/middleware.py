import logging
import uuid


class RequestIDMiddleware:
    """Attach a unique id to every request for correlating log lines."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = str(uuid.uuid4())[:8]
        response = self.get_response(request)
        response["X-Request-ID"] = request.request_id
        return response


class RequestIDLogFilter(logging.Filter):
    def filter(self, record):
        record.request_id = "-"
        return True
