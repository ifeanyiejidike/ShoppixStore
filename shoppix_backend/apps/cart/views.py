from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartItemSerializer, CartSerializer


class CartView(APIView):
    """GET /api/cart/ — fetch (and lazily create) the current user's cart."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)


class CartItemViewSet(viewsets.ModelViewSet):
    """
    /api/cart/items/ — add/update/remove items in the caller's own cart.
    Adding a product already in the cart increments quantity instead of
    erroring, which is the behaviour users expect from "add to cart".
    """

    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user).select_related("product")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        existing = CartItem.objects.filter(cart=cart, product_id=product_id).first()
        if existing:
            serializer = self.get_serializer(
                existing, data={"quantity": existing.quantity + quantity}, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(cart=cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        if serializer.instance.cart.user_id != self.request.user.id:
            raise ValidationError("Not your cart item.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.cart.user_id != self.request.user.id:
            raise ValidationError("Not your cart item.")
        instance.delete()


class ClearCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Cart.objects.filter(user=request.user).first() and request.user.cart.cart_items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
