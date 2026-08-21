import json
import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.orders.models import Order, OrderStatus
from apps.orders.services import mark_order_paid

from .gateways import GatewayError, generate_payment_reference, get_gateway
from .models import Payment, PaymentStatus
from .serializers import InitializePaymentSerializer, PaymentSerializer
from .tasks import notify_vendors_of_sale, send_order_confirmation_email

logger = logging.getLogger("apps.payments")


class InitializePaymentView(APIView):
    """POST /api/payments/initialize/ — starts a Paystack or Opay transaction
    for an existing order and returns the checkout URL to redirect to."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "checkout"
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        serializer = InitializePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order = get_object_or_404(Order, id=data["order_id"], user=request.user)
        if order.status != OrderStatus.PENDING_PAYMENT:
            return Response({"detail": "This order is not awaiting payment."}, status=status.HTTP_400_BAD_REQUEST)

        reference = generate_payment_reference()
        gateway = get_gateway(data["payment_method"])

        try:
            result = gateway.initialize(
                email=request.user.email,
                amount_kobo=int(order.amount * 100),
                reference=reference,
                callback_url=settings.PAYMENT_CALLBACK_URL,
                metadata={"order_id": str(order.id), "order_reference": order.order_reference},
            )
        except GatewayError as exc:
            logger.error("Payment init failed for order %s: %s", order.order_reference, exc)
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        payment = Payment.objects.create(
            user=request.user,
            order=order,
            amount=order.amount,
            payment_method=data["payment_method"],
            payment_reference=reference,
        )
        order.payment_reference = reference
        order.save(update_fields=["payment_reference"])

        return Response(
            {"authorization_url": result["authorization_url"], "reference": reference, "payment": PaymentSerializer(payment).data},
            status=status.HTTP_201_CREATED,
        )


class VerifyPaymentView(APIView):
    """GET /api/payments/verify/<reference>/ — used by the frontend's
    callback page as a fallback/confirmation alongside the webhook."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        payment = get_object_or_404(Payment, payment_reference=reference, user=request.user)
        _verify_and_settle(payment)
        return Response(PaymentSerializer(payment).data)


class PaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


def _verify_and_settle(payment: Payment):
    """Shared settlement logic used by both the webhook and the manual verify
    endpoint. Idempotent — safe to call multiple times for the same payment."""
    if payment.is_verified:
        return

    gateway = get_gateway(payment.payment_method)
    try:
        result = gateway.verify(payment.payment_reference)
    except GatewayError as exc:
        logger.error("Verification failed for %s: %s", payment.payment_reference, exc)
        return

    payment.gateway_response = result.get("raw")
    if result["successful"]:
        payment.payment_status = PaymentStatus.SUCCESSFUL
        payment.is_verified = True
        payment.save(update_fields=["payment_status", "is_verified", "gateway_response"])

        order = mark_order_paid(payment.order, payment.payment_reference)
        send_order_confirmation_email.delay(str(order.id))
        notify_vendors_of_sale.delay(str(order.id))
    else:
        payment.payment_status = PaymentStatus.FAILED
        payment.save(update_fields=["payment_status", "gateway_response"])


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(APIView):
    """Paystack calls this server-to-server on transaction events. CSRF is
    exempt here deliberately — the request is authenticated instead via the
    HMAC signature header, not a browser session/cookie."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_scope = "webhook"
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        gateway = get_gateway("paystack")
        if not gateway.verify_webhook_signature(request):
            logger.warning("Rejected Paystack webhook with invalid signature.")
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        payload = json.loads(request.body)
        reference = payload.get("data", {}).get("reference")
        payment = Payment.objects.filter(payment_reference=reference, payment_method="paystack").first()
        if payment:
            _verify_and_settle(payment)
        return Response(status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class OpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_scope = "webhook"
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        gateway = get_gateway("opay")
        if not gateway.verify_webhook_signature(request):
            logger.warning("Rejected Opay webhook with invalid signature.")
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        payload = json.loads(request.body)
        reference = payload.get("payload", {}).get("reference") or payload.get("reference")
        payment = Payment.objects.filter(payment_reference=reference, payment_method="opay").first()
        if payment:
            _verify_and_settle(payment)
        return Response(status=status.HTTP_200_OK)
