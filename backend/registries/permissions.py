from rest_framework import permissions


def _owner_of(obj):
    owner = getattr(obj, "owner", None)
    if owner is not None:
        return owner
    registry = getattr(obj, "registry", None)
    return getattr(registry, "owner", None)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Read for anyone; write only for the object's (registry) owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return _owner_of(obj) == request.user
