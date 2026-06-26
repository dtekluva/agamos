"""Central API URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from registries.views import (
    RegistryViewSet, PublicRegistryView, StoryMomentViewSet, GalleryImageViewSet,
    TributeViewSet, GuestUploadViewSet, EventGuestViewSet, GuestRSVPView, GuestPassQRView,
    CheckinInfoView, CheckinResolveView, CheckinSearchView, CheckinDoView,
)
from gifts.views import GiftViewSet, GiftReserveView
from accounts.views import ContactView

router = DefaultRouter()
router.register("registries", RegistryViewSet, basename="registry")
router.register("gifts", GiftViewSet, basename="gift")
router.register("moments", StoryMomentViewSet, basename="moment")
router.register("gallery", GalleryImageViewSet, basename="gallery")
router.register("tributes", TributeViewSet, basename="tribute")
router.register("guest-uploads", GuestUploadViewSet, basename="guest-upload")
router.register("guests", EventGuestViewSet, basename="eventguest")

urlpatterns = [
    path("auth/", include("accounts.urls")),
    path("contact", ContactView.as_view()),
    path("r/<slug:slug>", PublicRegistryView.as_view()),
    path("gifts/<int:pk>/reserve", GiftReserveView.as_view()),
    path("i/<str:token>", GuestRSVPView.as_view()),
    path("i/<str:token>/qr.png", GuestPassQRView.as_view()),
    path("checkin/<str:door_token>", CheckinInfoView.as_view()),
    path("checkin/<str:door_token>/resolve", CheckinResolveView.as_view()),
    path("checkin/<str:door_token>/search", CheckinSearchView.as_view()),
    path("checkin/<str:door_token>/checkin", CheckinDoView.as_view()),
    path("", include("payments.urls")),
    path("", include(router.urls)),
]
