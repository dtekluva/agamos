from rest_framework import serializers

from config.media import abs_media
from .models import Gift


class GiftSerializer(serializers.ModelSerializer):
    amount_raised = serializers.ReadOnlyField()
    pct_funded = serializers.ReadOnlyField()
    remaining = serializers.ReadOnlyField()
    fully_funded = serializers.ReadOnlyField()
    is_reserved = serializers.ReadOnlyField()
    display_image = serializers.SerializerMethodField()

    def get_display_image(self, obj):
        return abs_media(self.context, obj.image, obj.image_url)

    class Meta:
        model = Gift
        fields = (
            "id", "registry", "title", "description", "image", "image_url",
            "display_image", "category", "kind", "target_amount", "allow_partial",
            "is_cash_fund", "show_progress", "sort_order", "archived", "amount_raised",
            "pct_funded", "remaining", "fully_funded",
            "is_reserved", "reserved_name", "reserved_at", "created_at",
        )
        # reserved_* are set via the reserve endpoint, never by the gift form.
        read_only_fields = ("created_at", "reserved_at", "reserved_name")
