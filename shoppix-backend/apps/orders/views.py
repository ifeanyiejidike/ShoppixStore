from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import ShippingAddress
from apps.common.permissions import IsVendor

from .models import Order, OrderItem, OrderStatus
from .serializers import CheckoutSerializer, OrderSerializer, VendorOrderItemSerializer
from .services import CheckoutError, cancel_order, checkout_cart


class CheckoutView(APIView):
    """POST /api/orders/checkout/ — converts the caller's cart into an Order."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "checkout"
    throttle_classes = [ScopedRateThrottle]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        address = get_object_or_404(
            ShippingAddress, pk=serializer.validated_data["shipping_address_id"], user=request.user
        )
        try:
            order = checkout_cart(user=request.user, shipping_address=address)
        except CheckoutError as exc:
            return Response({"detail": exc.detail}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    """GET /api/orders/ — the caller's own order history."""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status"]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("order_items")


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        order = get_object_or_404(Order, id=id, user=request.user)
        try:
            order = cancel_order(order)
        except CheckoutError as exc:
            return Response({"detail": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderSerializer(order).data)


class VendorOrderItemListView(generics.ListAPIView):
    """GET /api/orders/vendor/ — vendor's own sold line items across all orders."""

    serializer_class = VendorOrderItemSerializer
    permission_classes = [IsVendor]
    filterset_fields = ["fulfillment_status"]

    def get_queryset(self):
        return OrderItem.objects.filter(vendor=self.request.user.vendor).select_related("order", "order__user")


class VendorOrderItemStatusUpdateView(APIView):
    """PATCH /api/orders/vendor/<item_id>/status/ — vendor updates fulfillment
    status (e.g. processing -> shipped -> delivered) for their own line item only."""

    permission_classes = [IsVendor]

    ALLOWED_TRANSITIONS = {
        OrderStatus.PAID: [OrderStatus.PROCESSING],
        OrderStatus.PROCESSING: [OrderStatus.SHIPPED],
        OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
    }

    def patch(self, request, item_id):
        item = get_object_or_404(OrderItem, id=item_id, vendor=request.user.vendor)
        new_status = request.data.get("status")
        allowed = self.ALLOWED_TRANSITIONS.get(item.fulfillment_status, [])
        if new_status not in allowed:
            return Response(
                {"detail": f"Cannot move from '{item.fulfillment_status}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item.fulfillment_status = new_status
        item.save(update_fields=["fulfillment_status"])
        return Response(VendorOrderItemSerializer(item).data)
