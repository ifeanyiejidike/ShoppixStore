from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.pagination import StandardResultsSetPagination
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
    The default list/retrieve only ever shows active products with stock
    context; a vendor managing their own catalog (including inactive/expired
    listings) uses GET /products/mine/ instead.
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
        if self.action in ["list"]:
            return ProductListSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "vendor") or not self.request.user.vendor.is_activated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only approved vendors can list products.")
        serializer.save()  # ProductSerializer.create() attaches request.user.vendor

    @action(detail=False, methods=["get"], permission_classes=[IsVendor], pagination_class=StandardResultsSetPagination)
    def mine(self, request):
        """GET /api/catalog/products/mine/ — the logged-in vendor's full
        catalog, including inactive listings and expired flash sales that
        the public list endpoint deliberately hides."""
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        serializer = ProductSerializer(page or qs, many=True, context={"request": request})
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
