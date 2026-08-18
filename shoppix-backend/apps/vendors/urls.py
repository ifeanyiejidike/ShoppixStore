from rest_framework.routers import DefaultRouter
from django.urls import path

from . import views

router = DefaultRouter()
router.register("admin/vendors", views.VendorAdminApprovalViewSet, basename="vendor-admin")
router.register("", views.VendorPublicViewSet, basename="vendor-public")

urlpatterns = [
    path("apply/", views.VendorApplicationView.as_view(), name="vendor-apply"),
    path("me/", views.MyVendorProfileView.as_view(), name="vendor-me"),
] + router.urls

app_name = "vendors"
