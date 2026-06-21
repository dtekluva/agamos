import hashlib
import os

from django.conf import settings
from rest_framework import viewsets, generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.throttling import ScopedRateThrottle

from config.storages import VIDEO_EXTS
from .models import Registry, StoryMoment, GalleryImage, Tribute, GuestUpload
from .serializers import (
    RegistrySerializer, PublicRegistrySerializer,
    StoryMomentSerializer, GalleryImageSerializer, TributeSerializer,
    GuestUploadSerializer,
)
from .permissions import IsOwnerOrReadOnly

# Guest upload caps
MAX_IMAGE_BYTES = 10 * 1024 * 1024     # 10 MB
MAX_VIDEO_BYTES = 100 * 1024 * 1024    # 100 MB
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".bmp"}
MAX_UPLOADS_PER_EVENT = 500            # safety cap per event


class RegistryViewSet(viewsets.ModelViewSet):
    serializer_class = RegistrySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Registry.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class _RegistryChildViewSet(viewsets.ModelViewSet):
    """Base for StoryMoment / GalleryImage — scoped to the owner's registries."""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        registry = serializer.validated_data.get("registry")
        if registry is None or registry.owner != self.request.user:
            raise PermissionDenied("You can only add to your own registry.")
        serializer.save()


class StoryMomentViewSet(_RegistryChildViewSet):
    serializer_class = StoryMomentSerializer

    def get_queryset(self):
        return StoryMoment.objects.filter(registry__owner=self.request.user)


class GalleryImageViewSet(_RegistryChildViewSet):
    serializer_class = GalleryImageSerializer

    def get_queryset(self):
        return GalleryImage.objects.filter(registry__owner=self.request.user)


class PublicRegistryView(generics.RetrieveAPIView):
    """No auth — the shareable page friends visit. Unpublished (draft) pages are
    hidden from everyone except their owner (who can preview while logged in)."""
    serializer_class = PublicRegistrySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    queryset = Registry.objects.all()

    def get_object(self):
        from rest_framework.exceptions import NotFound
        obj = super().get_object()
        if not obj.published:
            user = self.request.user
            if not (user.is_authenticated and obj.owner_id == user.id):
                raise NotFound("This event page isn’t published yet.")
        return obj


class TributeViewSet(viewsets.ModelViewSet):
    """Guests post tributes (memorial); the registry owner can remove them."""
    serializer_class = TributeSerializer

    def get_permissions(self):
        if self.action in ("create", "list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Tribute.objects.all()
        rid = self.request.query_params.get("registry")
        if rid:
            qs = qs.filter(registry_id=rid)
        if self.action in ("destroy", "update", "partial_update"):
            qs = qs.filter(registry__owner=self.request.user)
        return qs


def _hash_ip(request):
    ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() \
        or request.META.get("REMOTE_ADDR", "")
    if not ip:
        return ""
    return hashlib.sha256(f"{ip}{settings.SECRET_KEY}".encode()).hexdigest()


class GuestUploadViewSet(viewsets.ModelViewSet):
    """Visitors post their own photos/videos on a public event page (auto-published).
    The registry owner can delete anything from their dashboard."""
    serializer_class = GuestUploadSerializer
    throttle_scope = "guest_upload"

    def get_permissions(self):
        if self.action in ("create", "list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_throttles(self):
        # Only rate-limit the public create action.
        if self.action == "create":
            return [ScopedRateThrottle()]
        return []

    def get_queryset(self):
        qs = GuestUpload.objects.all()
        rid = self.request.query_params.get("registry")
        if rid:
            qs = qs.filter(registry_id=rid)
        # Owner-scope any mutating actions so guests can't delete others' uploads.
        if self.action in ("destroy", "update", "partial_update"):
            qs = qs.filter(registry__owner=self.request.user)
        return qs

    def perform_create(self, serializer):
        registry = serializer.validated_data.get("registry")
        if registry is None:
            raise ValidationError({"registry": "This field is required."})
        if not registry.published:
            raise PermissionDenied("This event page isn’t published yet.")
        if not registry.show_guest_uploads:
            raise PermissionDenied("Guest uploads are turned off for this event.")
        if registry.guest_uploads.count() >= MAX_UPLOADS_PER_EVENT:
            raise ValidationError("This event has reached its upload limit.")

        media = serializer.validated_data.get("media")
        if media is None:
            raise ValidationError({"media": "No file was uploaded."})
        ext = os.path.splitext(media.name or "")[1].lower()
        is_video = ext in VIDEO_EXTS
        if not is_video and ext not in IMAGE_EXTS:
            raise ValidationError({"media": "Only image or video files are allowed."})
        if is_video and not registry.guest_uploads_allow_video:
            raise ValidationError({"media": "Only photos can be shared on this event."})
        cap = MAX_VIDEO_BYTES if is_video else MAX_IMAGE_BYTES
        if media.size and media.size > cap:
            mb = cap // (1024 * 1024)
            kind = "Videos" if is_video else "Photos"
            raise ValidationError({"media": f"{kind} must be {mb} MB or smaller."})

        serializer.save(
            media_type=GuestUpload.VIDEO if is_video else GuestUpload.IMAGE,
            ip_hash=_hash_ip(self.request),
        )
