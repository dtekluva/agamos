"""Storage helpers for guest media (photos AND videos).

The default Cloudinary backend only handles images. Guest uploads can also be
short videos, so we use a backend that picks the right Cloudinary `resource_type`
from the file extension — that keeps upload, URL building, and deletion all
consistent (Cloudinary's destroy API needs the real resource type, not 'auto').

In dev (no Cloudinary credentials) this transparently falls back to the local
filesystem storage, which handles video files fine.
"""
import os

from django.conf import settings
from django.core.files.storage import default_storage

VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv", ".ogv", ".3gp"}


def _build_cloudinary_storage():
    from cloudinary_storage.storage import MediaCloudinaryStorage

    class GuestMediaCloudinaryStorage(MediaCloudinaryStorage):
        def _get_resource_type(self, name):
            ext = os.path.splitext(name)[1].lower()
            return "video" if ext in VIDEO_EXTS else "image"

    return GuestMediaCloudinaryStorage()


def guest_media_storage():
    """Callable storage for the GuestUpload.media field (deconstructible)."""
    if getattr(settings, "USE_CLOUDINARY", False):
        return _build_cloudinary_storage()
    return default_storage
