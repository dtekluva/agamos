"""Central API URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from registries.views import (
    RegistryViewSet, PublicRegistryView, StoryMomentViewSet, GalleryImageViewSet,
    TributeViewSet, GuestUploadViewSet,
)
from gifts.views import GiftViewSet
from accounts.views import ContactView

router = DefaultRouter()
router.register("registries", RegistryViewSet, basename="registry")
router.register("gifts", GiftViewSet, basename="gift")
router.register("moments", StoryMomentViewSet, basename="moment")
router.register("gallery", GalleryImageViewSet, basename="gallery")
router.register("tributes", TributeViewSet, basename="tribute")
router.register("guest-uploads", GuestUploadViewSet, basename="guest-upload")

urlpatterns = [
    path("auth/", include("accounts.urls")),
    path("contact", ContactView.as_view()),
    path("r/<slug:slug>", PublicRegistryView.as_view()),
    path("", include("payments.urls")),
    path("", include(router.urls)),
]
