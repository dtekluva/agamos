from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied

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
