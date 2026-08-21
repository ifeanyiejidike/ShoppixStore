from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import IsVendor

from .models import Vendor
from .permissions import IsVendorOwner
from .serializers import VendorApplicationSerializer, VendorSerializer
from .tasks import notify_vendor_activation


class VendorApplicationView(generics.CreateAPIView):
    """POST /api/vendors/apply/ — a logged-in customer applies to sell."""

    serializer_class = VendorApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if hasattr(request.user, "vendor"):
            return Response({"detail": "You already have a vendor profile."}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)


class MyVendorProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/vendors/me/ — the logged-in vendor manages their own storefront."""

    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.vendor


class VendorPublicViewSet(viewsets.ReadOnlyModelViewSet):
    """Public storefront listing — anyone can browse activated vendors."""

    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    queryset = Vendor.objects.filter(is_activated=True)
    filterset_fields = ["is_diamond"]
    search_fields = ["brand_name", "description"]


class VendorAdminApprovalViewSet(viewsets.ModelViewSet):
    """Admin-only: list all vendor applications and approve/reject/suspend."""

    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Vendor.objects.all()

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        vendor = self.get_object()
        vendor.is_activated = True
        vendor.activated_at = timezone.now()
        vendor.save(update_fields=["is_activated", "activated_at"])
        notify_vendor_activation.delay(str(vendor.id))
        return Response(VendorSerializer(vendor).data)

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        vendor = self.get_object()
        vendor.is_activated = False
        vendor.save(update_fields=["is_activated"])
        return Response(VendorSerializer(vendor).data)
