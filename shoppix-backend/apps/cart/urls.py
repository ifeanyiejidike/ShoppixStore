from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("items", views.CartItemViewSet, basename="cart-item")

urlpatterns = [
    path("", views.CartView.as_view(), name="cart"),
    path("clear/", views.ClearCartView.as_view(), name="cart-clear"),
] + router.urls

app_name = "cart"
