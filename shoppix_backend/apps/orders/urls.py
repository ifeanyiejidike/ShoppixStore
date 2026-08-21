from django.urls import path

from . import views

urlpatterns = [
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("", views.OrderListView.as_view(), name="order-list"),
    path("vendor/", views.VendorOrderItemListView.as_view(), name="vendor-order-items"),
    path("vendor/<uuid:item_id>/status/", views.VendorOrderItemStatusUpdateView.as_view(), name="vendor-order-item-status"),
    path("<uuid:id>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("<uuid:id>/cancel/", views.OrderCancelView.as_view(), name="order-cancel"),
]

app_name = "orders"
