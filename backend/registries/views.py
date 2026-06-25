import hashlib
import os

from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, generics, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from config import emails
from config.storages import VIDEO_EXTS
from .models import Registry, StoryMoment, GalleryImage, Tribute, GuestUpload, EventGuest
from .serializers import (
    RegistrySerializer, PublicRegistrySerializer,
    StoryMomentSerializer, GalleryImageSerializer, TributeSerializer,
    GuestUploadSerializer, EventGuestSerializer, PublicGuestSerializer,
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
        user = self.request.user
        # Guests get one free event; creating more requires a real account.
        if not user.is_claimed and Registry.objects.filter(owner=user).exists():
            raise PermissionDenied(
                "Create a free account to save your event and add more."
            )
        serializer.save(owner=user)


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


class EventGuestViewSet(viewsets.ModelViewSet):
    """Host manages their guest list — add guests, send invites, track RSVPs."""
    serializer_class = EventGuestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = EventGuest.objects.filter(registry__owner=self.request.user)
        rid = self.request.query_params.get("registry")
        if rid:
            qs = qs.filter(registry_id=rid)
        return qs

    def perform_create(self, serializer):
        registry = serializer.validated_data.get("registry")
        if registry is None or registry.owner != self.request.user:
            raise PermissionDenied("Not your event.")
        serializer.save()

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        guest = self.get_object()
        if not guest.email:
            raise ValidationError({"detail": "Add an email address before sending an invite."})
        sent = emails.send_invite_email(guest)
        if sent:
            guest.invited_at = timezone.now()
            guest.save(update_fields=["invited_at"])
        else:
            raise ValidationError({"detail": "Could not send the invite. Please try again."})
        return Response(EventGuestSerializer(guest, context={"request": request}).data)


class GuestRSVPView(APIView):
    """A guest's personalised invite landing (token link) — view the event and
    RSVP. No login. Viewing marks the guest as 'viewed' for the host's tracking."""
    permission_classes = [permissions.AllowAny]

    def _get(self, token):
        return EventGuest.objects.select_related("registry").filter(token=token).first()

    def get(self, request, token):
        guest = self._get(token)
        if not guest:
            return Response({"detail": "Invite not found."}, status=404)
        if not guest.viewed_at:
            guest.viewed_at = timezone.now()
            guest.save(update_fields=["viewed_at"])
        return Response(PublicGuestSerializer(guest, context={"request": request}).data)

    def post(self, request, token):
        guest = self._get(token)
        if not guest:
            return Response({"detail": "Invite not found."}, status=404)
        status_in = request.data.get("rsvp_status")
        if status_in not in ("yes", "no"):
            return Response({"rsvp_status": ["Choose attending or can't make it."]}, status=400)
        try:
            ps = int(request.data.get("party_size", guest.party_size) or 1)
        except (TypeError, ValueError):
            ps = 1
        was_attending = guest.rsvp_status == "yes"
        guest.rsvp_status = status_in
        guest.party_size = max(1, min(ps, 20))
        guest.rsvp_at = timezone.now()
        guest.save(update_fields=["rsvp_status", "party_size", "rsvp_at"])
        # On a fresh 'attending', email the guest their entry pass (code + QR).
        if status_in == "yes" and not was_attending:
            emails.send_rsvp_confirmation_email(guest)
        return Response(PublicGuestSerializer(guest, context={"request": request}).data)


def _qr_png_bytes(data):
    import io
    import qrcode
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class GuestPassQRView(APIView):
    """Returns the guest's entry-pass QR as a PNG (encodes their pass URL).
    Public but unguessable (the token is a 32-char secret)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        from django.http import HttpResponse, Http404
        if not EventGuest.objects.filter(token=token).exists():
            raise Http404
        pass_url = f"{settings.FRONTEND_URL.rstrip('/')}/i/{token}"
        resp = HttpResponse(_qr_png_bytes(pass_url), content_type="image/png")
        resp["Cache-Control"] = "public, max-age=86400"
        return resp

        serializer.save(
            media_type=GuestUpload.VIDEO if is_video else GuestUpload.IMAGE,
            ip_hash=_hash_ip(self.request),
        )
