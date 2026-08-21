from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("", views.ReviewViewSet, basename="review")

urlpatterns = router.urls
app_name = "reviews"
