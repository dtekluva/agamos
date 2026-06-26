from rest_framework import serializers

from config.media import abs_media
from gifts.serializers import GiftSerializer
from .models import Registry, StoryMoment, GalleryImage, Tribute, GuestUpload, EventGuest


class StoryMomentSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = StoryMoment
        fields = ("id", "registry", "title", "date", "description",
                  "image", "image_url", "display_image", "sort_order")

    def get_display_image(self, obj):
        return abs_media(self.context, obj.image, obj.image_url)


class GalleryImageSerializer(serializers.ModelSerializer):
    display_image = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = ("id", "registry", "image", "image_url", "display_image",
                  "caption", "sort_order")

    def get_display_image(self, obj):
        return abs_media(self.context, obj.image, obj.image_url)


class TributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tribute
        fields = ("id", "registry", "name", "message", "created_at")
        read_only_fields = ("created_at",)


class GuestUploadSerializer(serializers.ModelSerializer):
    display_media = serializers.SerializerMethodField()

    class Meta:
        model = GuestUpload
        fields = ("id", "registry", "media", "display_media", "media_type",
                  "uploader_name", "caption", "created_at")
        read_only_fields = ("media_type", "created_at")
        extra_kwargs = {"media": {"write_only": True}}

    def get_display_media(self, obj):
        return abs_media(self.context, obj.media, "")


# Fields shared between owner + public views
_EXHIBITION_FIELDS = (
    "id", "slug", "event_type", "partner_one_name", "partner_two_name",
    "organiser_name", "display_name", "couple_names", "is_memorial",
    "event_date", "years_celebrated", "turning_age",
    "venue", "city", "cover_image", "cover_image_url", "cover",
    "hero_message", "our_story", "show_story", "show_timeline", "show_gallery",
    "show_event_details", "show_registry", "show_tributes",
    "show_guest_uploads", "guest_uploads_allow_video", "theme", "currency", "published",
)


class RegistrySerializer(serializers.ModelSerializer):
    """Owner-facing: includes bank details + balances + nested children."""
    display_name = serializers.ReadOnlyField()
    couple_names = serializers.ReadOnlyField()
    is_memorial = serializers.ReadOnlyField()
    event_date = serializers.DateField(source="wedding_date", required=False, allow_null=True)
    cover = serializers.SerializerMethodField()

    def get_cover(self, obj):
        return abs_media(self.context, obj.cover_image, obj.cover_image_url)
    total_raised = serializers.ReadOnlyField()
    total_withdrawn = serializers.ReadOnlyField()
    available_balance = serializers.ReadOnlyField()
    pending_balance = serializers.ReadOnlyField()
    withdrawal_fee = serializers.SerializerMethodField()

    def get_withdrawal_fee(self, obj):
        from django.conf import settings
        return {
            "model": settings.WITHDRAWAL_FEE_MODEL,
            "flat": settings.WITHDRAWAL_FEE_FLAT,
            "percent": settings.WITHDRAWAL_FEE_PERCENT,
            "min_withdrawal": settings.MIN_WITHDRAWAL,
            "kyc_cap": settings.KYC_WITHDRAWAL_CAP,
        }
    gifts = GiftSerializer(many=True, read_only=True)
    moments = StoryMomentSerializer(many=True, read_only=True)
    gallery = GalleryImageSerializer(many=True, read_only=True)
    tributes = TributeSerializer(many=True, read_only=True)
    guest_uploads = GuestUploadSerializer(many=True, read_only=True)

    class Meta:
        model = Registry
        fields = _EXHIBITION_FIELDS + (
            "visibility",
            "bank_name", "bank_code", "account_number", "account_name",
            "paystack_recipient_code", "checkin_token",
            "total_raised", "total_withdrawn", "available_balance", "pending_balance",
            "withdrawal_fee",
            "gifts", "moments", "gallery", "tributes", "guest_uploads", "created_at",
        )
        read_only_fields = ("slug", "created_at", "paystack_recipient_code", "checkin_token")


class PublicRegistrySerializer(serializers.ModelSerializer):
    """Guest-facing: no bank details. Respects exhibition toggles."""
    display_name = serializers.ReadOnlyField()
    couple_names = serializers.ReadOnlyField()
    is_memorial = serializers.ReadOnlyField()
    event_date = serializers.DateField(source="wedding_date", required=False, allow_null=True)
    cover = serializers.SerializerMethodField()

    def get_cover(self, obj):
        return abs_media(self.context, obj.cover_image, obj.cover_image_url)
    total_raised = serializers.ReadOnlyField()
    gifts = serializers.SerializerMethodField()
    moments = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()
    tributes = serializers.SerializerMethodField()
    guest_uploads = serializers.SerializerMethodField()

    class Meta:
        model = Registry
        fields = _EXHIBITION_FIELDS + (
            "total_raised", "gifts", "moments", "gallery", "tributes", "guest_uploads")

    def get_gifts(self, obj):
        if not obj.show_registry:
            return []
        qs = obj.gifts.filter(archived=False)
        return GiftSerializer(qs, many=True, context=self.context).data

    def get_moments(self, obj):
        if not obj.show_timeline:
            return []
        return StoryMomentSerializer(obj.moments.all(), many=True, context=self.context).data

    def get_gallery(self, obj):
        if not obj.show_gallery:
            return []
        return GalleryImageSerializer(obj.gallery.all(), many=True, context=self.context).data

    def get_tributes(self, obj):
        if not obj.show_tributes:
            return []
        return TributeSerializer(obj.tributes.all(), many=True, context=self.context).data

    def get_guest_uploads(self, obj):
        if not obj.show_guest_uploads:
            return []
        return GuestUploadSerializer(obj.guest_uploads.all(), many=True, context=self.context).data


class EventGuestSerializer(serializers.ModelSerializer):
    """Host-facing: manage the guest list."""
    party_size = serializers.IntegerField(min_value=1, max_value=20, required=False, default=1)

    class Meta:
        model = EventGuest
        fields = (
            "id", "registry", "name", "email", "phone", "code", "token",
            "rsvp_status", "party_size", "table",
            "invited_at", "viewed_at", "rsvp_at", "contributed_at", "checked_in_at", "created_at",
        )
        read_only_fields = (
            "code", "token", "rsvp_status",
            "invited_at", "viewed_at", "rsvp_at", "contributed_at", "checked_in_at", "created_at",
        )


class PublicGuestSerializer(serializers.ModelSerializer):
    """Guest-facing (token landing): who they are + the event, for RSVP."""
    event = serializers.SerializerMethodField()

    class Meta:
        model = EventGuest
        fields = ("name", "rsvp_status", "party_size", "table", "code", "event")

    def get_event(self, obj):
        r = obj.registry
        return {
            "display_name": r.display_name,
            "slug": r.slug,
            "event_date": r.wedding_date,
            "city": r.city,
            "venue": r.venue,
            "published": r.published,
        }
