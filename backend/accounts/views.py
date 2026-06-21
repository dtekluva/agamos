from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer, UserSerializer, EmailTokenObtainPairSerializer,
    ContactMessageSerializer,
)

User = get_user_model()


class ContactView(generics.CreateAPIView):
    """Public 'Contact us' form — saves the message in Django and best-effort
    emails the team. No login required; rate-limited to deter spam."""
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def perform_create(self, serializer):
        msg = serializer.save()
        try:
            send_mail(
                subject=f"[Agamos] Contact: {msg.subject or 'New message'} — {msg.name}",
                message=f"From: {msg.name} <{msg.email}>\n\n{msg.message}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CONTACT_EMAIL],
                fail_silently=True,
            )
        except Exception:
            pass  # never let a mail hiccup fail the submission — it's saved in the DB


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Logged-in user changes their own password (verifies current)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current = request.data.get("current_password") or ""
        new = request.data.get("new_password") or ""
        if not request.user.check_password(current):
            return Response({"current_password": ["Current password is incorrect."]}, status=400)
        if len(new) < 8:
            return Response({"new_password": ["Password must be at least 8 characters."]}, status=400)
        request.user.set_password(new)
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password changed."})


class PasswordResetRequestView(APIView):
    """Email a reset link. Always returns 200 (don't reveal whether the email exists)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
                send_mail(
                    "Reset your Agamos password",
                    f"Hi,\n\nReset your password using the link below:\n{link}\n\n"
                    "If you didn’t request this, you can safely ignore this email.",
                    getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@agamos.app"),
                    [user.email],
                    fail_silently=True,
                )
        return Response({"detail": "If that email exists, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password") or ""
        if len(password) < 8:
            return Response({"password": ["Password must be at least 8 characters."]}, status=400)
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "Invalid reset link."}, status=400)
        if not default_token_generator.check_token(user, token):
            return Response({"detail": "This reset link is invalid or has expired."}, status=400)
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated. You can now log in."})
