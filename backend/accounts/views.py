import re
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
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
from config import emails

User = get_user_model()


def _magic_link(user, guest_id=None):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    url = f"{settings.FRONTEND_URL}/magic?uid={uid}&token={token}"
    if guest_id:
        url += f"&g={guest_id}"
    return url


class MagicLinkRequestView(APIView):
    """Passwordless return: email a sign-in link. Always 200 (don't reveal existence)."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if email:
            user = User.objects.filter(email__iexact=email, is_claimed=True).first()
            if user:
                emails.send_magic_link_email(user, _magic_link(user))
        return Response({"detail": "If that email has an account, we've sent a sign-in link."})


class MagicLoginView(APIView):
    """Consume a sign-in link → JWT. Optionally re-parents a guest draft (g)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(request.data.get("uid"))))
        except Exception:
            return Response({"detail": "This sign-in link is invalid."}, status=400)
        if not default_token_generator.check_token(user, request.data.get("token")):
            return Response({"detail": "This sign-in link is invalid or has expired."}, status=400)
        g = request.data.get("g")
        if g:
            from registries.models import Registry
            guest = User.objects.filter(pk=g, is_claimed=False).first()
            if guest:
                Registry.objects.filter(owner=guest).update(owner=user)
                guest.delete()
        user.email_verified = True  # clicking the emailed link proves they own the address
        user.last_login = timezone.now()  # makes the link single-use (invalidates the token)
        user.save(update_fields=["email_verified", "last_login"])
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })



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
        emails.send_verification_email(user)  # welcome + verify (soft gate)
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


class EmailVerifyView(APIView):
    """Confirm an email-verification link (uid + token), marking the email verified."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "Invalid verification link."}, status=400)
        if user.email_verified:
            return Response({"detail": "Your email is already verified."})
        if not default_token_generator.check_token(user, token):
            return Response({"detail": "This verification link is invalid or has expired."}, status=400)
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        return Response({"detail": "Email verified. Thank you!"})


class ResendVerificationView(APIView):
    """Logged-in user asks for a fresh verification email."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.email_verified:
            return Response({"detail": "Your email is already verified."})
        emails.send_verification_email(request.user)
        return Response({"detail": "Verification email sent. Please check your inbox."})


class GuestView(APIView):
    """Create an anonymous guest account so a visitor can build an event before
    signing up. Returns a JWT like login. Rate-limited per IP to deter abuse."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "guest_create"

    def post(self, request):
        user = User.objects.create_user(
            email=f"guest+{uuid.uuid4().hex}@agamos.local",
            password=None,            # unusable until claimed
            is_claimed=False,
        )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class ClaimView(APIView):
    """A guest converts their draft into a real account.

    - New email -> upgrade the guest in place (keeps the same event).
    - Existing email + correct password -> log into that account AND move the
      guest's draft event(s) onto it (re-parent), then delete the guest.
    - Existing email + wrong password -> error.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        guest = request.user
        if guest.is_claimed:
            return Response({"detail": "Your account is already set up."}, status=400)

        email = (request.data.get("email") or "").strip().lower()
        full_name = (request.data.get("full_name") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        password = request.data.get("password") or ""

        if not email:
            return Response({"email": ["This field is required."]}, status=400)

        existing = User.objects.filter(email__iexact=email).exclude(pk=guest.pk).first()
        if existing:
            # With a password, verify + merge now; otherwise email a sign-in link
            # that re-parents this draft onto the existing account on click.
            if password:
                from django.contrib.auth import authenticate
                from registries.models import Registry
                auth_user = authenticate(request, username=email, password=password)
                if auth_user is None or auth_user.pk != existing.pk:
                    return Response({"detail": "That email has an account. Use its password, or "
                                    "leave the password blank and we'll email you a sign-in link."}, status=400)
                Registry.objects.filter(owner=guest).update(owner=existing)
                guest.delete()
                refresh = RefreshToken.for_user(existing)
                return Response({"user": UserSerializer(existing).data, "access": str(refresh.access_token),
                                 "refresh": str(refresh), "merged": True})
            emails.send_magic_link_email(existing, _magic_link(existing, guest_id=guest.id))
            return Response({"magic_sent": True,
                             "detail": "You already have an account — we've emailed a sign-in link to add this event to it."})

        # New account — name + email is enough; password is optional (passwordless
        # users return via the magic sign-in link).
        if phone and len(re.sub(r"\D", "", phone)) < 7:
            return Response({"phone": ["Enter a valid phone number."]}, status=400)
        if password and len(password) < 8:
            return Response({"password": ["Password must be at least 8 characters."]}, status=400)
        guest.email = email
        guest.full_name = full_name
        guest.phone = phone
        guest.is_claimed = True
        if password:
            guest.set_password(password)
        else:
            guest.set_unusable_password()
        guest.save()
        emails.send_verification_email(guest)
        refresh = RefreshToken.for_user(guest)
        return Response({"user": UserSerializer(guest).data, "access": str(refresh.access_token),
                         "refresh": str(refresh), "merged": False})


class KycSubmitView(APIView):
    """Submit NIN + selfie to lift the withdrawal cap. No provider is wired yet,
    so the stub auto-approves; a real provider would set pending → verified async."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.kyc_status == "verified":
            return Response({"kyc_status": "verified", "detail": "You're already verified."})
        nin = re.sub(r"\D", "", request.data.get("nin") or "")
        if len(nin) != 11:
            return Response({"nin": ["Enter your 11-digit NIN."]}, status=400)
        # request.FILES.get("selfie") would go to the KYC provider; the stub ignores it.
        user.kyc_submitted_at = timezone.now()
        if settings.KYC_AUTO_APPROVE:
            user.kyc_status = "verified"
            user.kyc_reviewed_at = timezone.now()
        else:
            user.kyc_status = "pending"
        user.save(update_fields=["kyc_status", "kyc_submitted_at", "kyc_reviewed_at"])
        return Response({"kyc_status": user.kyc_status})
