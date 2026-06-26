from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from registries.permissions import IsOwnerOrReadOnly
from .models import Gift
from .serializers import GiftSerializer


class GiftViewSet(viewsets.ModelViewSet):
    serializer_class = GiftSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Gift.objects.filter(registry__owner=self.request.user)

    def perform_create(self, serializer):
        registry = serializer.validated_data.get("registry")
        if registry is None or registry.owner != self.request.user:
            raise PermissionDenied("You can only add gifts to your own registry.")
        serializer.save()

    @action(detail=True, methods=["post"], url_path="unreserve")
    def unreserve(self, request, pk=None):
        """Host clears a reservation (e.g. the reserver dropped out)."""
        gift = self.get_object()
        gift.reserved_name = ""
        gift.reserved_email = ""
        gift.reserved_at = None
        gift.save(update_fields=["reserved_name", "reserved_email", "reserved_at"])
        return Response(GiftSerializer(gift, context={"request": request}).data)


class GiftReserveView(APIView):
    """Public reserve-lock: a guest claims a physical item so no one double-buys it.
    Only applies to kind='item'; first claim wins."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        gift = Gift.objects.filter(pk=pk, archived=False).first()
        if not gift:
            raise NotFound("Gift not found.")
        if gift.kind != "item":
            raise ValidationError({"detail": "This gift can't be reserved."})
        if gift.is_reserved:
            raise ValidationError({"detail": "This gift has already been reserved."})
        name = (request.data.get("name") or "").strip()
        if not name:
            raise ValidationError({"name": ["Please add your name to reserve this gift."]})
        gift.reserved_name = name[:120]
        gift.reserved_email = (request.data.get("email") or "").strip()[:254]
        gift.reserved_at = timezone.now()
        gift.save(update_fields=["reserved_name", "reserved_email", "reserved_at"])
        return Response(GiftSerializer(gift, context={"request": request}).data, status=201)
