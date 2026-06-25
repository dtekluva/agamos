from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        # Lowercase the whole address so logins are case-insensitive and unique.
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("email_verified", True)
        return self._create_user(email, password, **extra)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email_verified = models.BooleanField(default=False)
    appreciation_sent = models.BooleanField(default=False)  # one-time welcome/appreciation campaign guard
    is_claimed = models.BooleanField(default=True)  # False = anonymous guest draft, not yet a real account
    # Identity verification (NIN + selfie) — unlocks withdrawals beyond the all-time cap.
    KYC = [("none", "None"), ("pending", "Pending"), ("verified", "Verified"), ("rejected", "Rejected")]
    kyc_status = models.CharField(max_length=10, choices=KYC, default="none")
    kyc_submitted_at = models.DateTimeField(null=True, blank=True)
    kyc_reviewed_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class ContactMessage(models.Model):
    """A "Contact us" submission from the public site (no login required)."""
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=160, blank=True)
    message = models.TextField()
    handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"
