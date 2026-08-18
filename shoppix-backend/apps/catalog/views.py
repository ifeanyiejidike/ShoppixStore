from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, viewsets

from apps.common.permissions import IsVendor

from .filters import ProductFilter
from .models import Category, Product
from .permissions import IsProductOwnerOrReadOnly
from .serializers import CategorySerializer, ProductListSerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"
    permission_classes = [permissions.IsAdminUser]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return super().get_permissions()


class ProductViewSet(viewsets.ModelViewSet):
    """
    Public read access; write access limited to the owning, activated vendor.
    Listing only ever shows active products with stock context; a vendor
    managing their own catalog sees everything via /products/mine/.
    """

    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsProductOwnerOrReadOnly]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "vendor__brand_name"]
    ordering_fields = ["current_price", "created_at", "name"]

    def get_queryset(self):
        qs = Product.objects.select_related("vendor", "category").prefetch_related("images")
        if self.action in ["update", "partial_update", "destroy", "mine"]:
            return qs.filter(vendor__user=self.request.user) if self.request.user.is_authenticated else qs.none()
        # Public-facing views only show active, purchasable-looking products
        qs = qs.filter(is_active=True, vendor__is_activated=True)
        # Flash sale correctness: hide expired flash sales from the flag automatically
        qs = qs.filter(Q(is_on_flash_sales=False) | Q(flash_sale_ends_at__isnull=True) | Q(flash_sale_ends_at__gte=timezone.now()))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "vendor") or not self.request.user.vendor.is_activated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only approved vendors can list products.")
        serializer.save()  # ProductSerializer.create() attaches request.user.vendor
