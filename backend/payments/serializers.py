from decimal import Decimal

from rest_framework import serializers

from gifts.models import Gift
from .models import Contribution, Withdrawal


class ContributionInitSerializer(serializers.Serializer):
    gift = serializers.PrimaryKeyRelatedField(queryset=Gift.objects.filter(archived=False))
    guest_name = serializers.CharField(max_length=120)
    guest_email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True)
    is_anonymous = serializers.BooleanField(default=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("100"))
    guest_token = serializers.CharField(required=False, allow_blank=True)  # from a personalised invite link

    def validate(self, attrs):
        gift = attrs["gift"]
        amount = attrs["amount"]
        # Full-purchase gifts (no partial, not a cash fund) must cover the remaining balance.
        if not gift.allow_partial and not gift.is_cash_fund:
            if gift.remaining and amount < gift.remaining:
                raise serializers.ValidationError(
                    {"amount": "This gift must be funded in full."}
                )
        return attrs


class ContributionSerializer(serializers.ModelSerializer):
    display_name = serializers.ReadOnlyField()
    gift_title = serializers.CharField(source="gift.title", read_only=True)

    class Meta:
        model = Contribution
        fields = (
            "id", "gift", "gift_title", "guest_name", "display_name", "guest_email",
            "message", "is_anonymous", "amount", "status", "thanked", "reference",
            "created_at", "paid_at",
        )
        read_only_fields = fields


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = ("id", "registry", "amount", "status", "reference", "note",
                  "requested_at", "processed_at")
        read_only_fields = ("status", "reference", "requested_at", "processed_at")
