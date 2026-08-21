from django.urls import path

from . import views

urlpatterns = [
    path("initialize/", views.InitializePaymentView.as_view(), name="payment-initialize"),
    path("verify/<str:reference>/", views.VerifyPaymentView.as_view(), name="payment-verify"),
    path("", views.PaymentListView.as_view(), name="payment-list"),
    path("webhooks/paystack/", views.PaystackWebhookView.as_view(), name="webhook-paystack"),
    path("webhooks/opay/", views.OpayWebhookView.as_view(), name="webhook-opay"),
]

app_name = "payments"
