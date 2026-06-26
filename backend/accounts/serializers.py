import re

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import ContactMessage

User = get_user_model()


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("id", "name", "email", "subject", "message", "created_at")
        read_only_fields = ("id", "created_at")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "phone", "email_verified", "is_claimed",
                  "kyc_status", "date_joined",
                  "notify_on_contribution", "notify_on_rsvp", "notify_product")
        read_only_fields = ("id", "email_verified", "is_claimed", "kyc_status", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    # Name + email is enough (A1). Password is optional — passwordless users
    # return via the magic sign-in link.
    password = serializers.CharField(write_only=True, min_length=8, required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "phone", "password")

    def validate_phone(self, value):
        if value and len(re.sub(r"\D", "", value)) < 7:
            raise serializers.ValidationError("Enter a valid phone number.")
        return (value or "").strip()

    def create(self, validated_data):
        password = validated_data.pop("password", "") or None
        return User.objects.create_user(password=password, **validated_data)


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
