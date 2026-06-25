import secrets

from django.conf import settings
from django.db import models
from django.db.models import Sum
from django.utils.text import slugify

from config.storages import guest_media_storage, VIDEO_EXTS


# --- Per-event upload paths: every event keeps its own folder (local + Cloudinary) ---
def cover_upload_to(instance, filename):
    return f"agamos/{instance.slug or 'misc'}/cover/{filename}"


def moment_upload_to(instance, filename):
    slug = getattr(instance.registry, "slug", "") or "misc"
    return f"agamos/{slug}/moments/{filename}"


def gallery_upload_to(instance, filename):
    slug = getattr(instance.registry, "slug", "") or "misc"
    return f"agamos/{slug}/gallery/{filename}"


def guest_upload_to(instance, filename):
    slug = getattr(instance.registry, "slug", "") or "misc"
    return f"agamos/{slug}/guests/{filename}"


class Registry(models.Model):
    THEMES = [
        ("blush", "Blush & Gold"),
        ("eternal", "Eternal"),
        ("nursery", "Nursery"),
        ("confetti", "Confetti"),
        ("memorial", "Memorial"),
        ("midnight", "Midnight"),
        ("sage", "Sage"),
    ]
    EVENT_TYPES = [
        ("wedding", "Wedding"),
        ("anniversary", "Anniversary"),
        ("baby_shower", "Baby shower"),
        ("birthday", "Birthday"),
        ("memorial", "Memorial"),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="registries")
    slug = models.SlugField(max_length=80, unique=True, blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default="wedding")
    # Headline names (labelled contextually per event type in the UI).
    partner_one_name = models.CharField(max_length=80)
    partner_two_name = models.CharField(max_length=80, blank=True)
    # "Hosted by / Organised by / the ___ family" (esp. birthday & memorial).
    organiser_name = models.CharField(max_length=120, blank=True)
    wedding_date = models.DateField(null=True, blank=True)  # the event date (any type)
    years_celebrated = models.PositiveIntegerField(null=True, blank=True)  # anniversary
    turning_age = models.PositiveIntegerField(null=True, blank=True)  # birthday
    venue = models.CharField(max_length=160, blank=True)
    city = models.CharField(max_length=120, blank=True)
    cover_image = models.ImageField(upload_to=cover_upload_to, max_length=255, null=True, blank=True)
    cover_image_url = models.URLField(blank=True)
    hero_message = models.CharField(max_length=240, blank=True)
    our_story = models.TextField(blank=True)

    # exhibition config — couple chooses what their public page shows
    show_story = models.BooleanField(default=True)
    show_timeline = models.BooleanField(default=True)
    show_gallery = models.BooleanField(default=True)
    show_event_details = models.BooleanField(default=True)
    show_registry = models.BooleanField(default=True)
    show_tributes = models.BooleanField(default=True)  # memorial tribute wall
    show_guest_uploads = models.BooleanField(default=True)  # guests post their own photos/videos
    guest_uploads_allow_video = models.BooleanField(default=True)  # allow video, not just photos
    theme = models.CharField(max_length=20, choices=THEMES, default="blush")

    currency = models.CharField(max_length=3, default="NGN")

    # withdrawals / bank details
    bank_name = models.CharField(max_length=120, blank=True)
    bank_code = models.CharField(max_length=10, blank=True)  # Paystack bank code (for transfers)
    account_number = models.CharField(max_length=20, blank=True)
    account_name = models.CharField(max_length=120, blank=True)
    paystack_recipient_code = models.CharField(max_length=80, blank=True)

    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "registries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.display_name} ({self.get_event_type_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            parts = [p.strip() for p in [self.partner_one_name, self.partner_two_name] if p and p.strip()]
            base = slugify("-and-".join(parts)) or "event"
            slug = base
            while Registry.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{secrets.token_hex(2)}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def display_name(self):
        one = (self.partner_one_name or "").strip()
        two = (self.partner_two_name or "").strip()
        if one and two:
            return f"{one} & {two}"
        return one or two or "Celebration"

    @property
    def couple_names(self):  # back-compat alias
        return self.display_name

    @property
    def is_memorial(self):
        return self.event_type == "memorial"

    @property
    def cover(self):
        if self.cover_image:
            return self.cover_image.url
        return self.cover_image_url

    @property
    def total_raised(self):
        from payments.models import Contribution
        agg = Contribution.objects.filter(
            gift__registry=self, status="success"
        ).aggregate(s=Sum("amount"))
        return agg["s"] or 0

    @property
    def total_withdrawn(self):
        agg = self.withdrawals.filter(status="paid").aggregate(s=Sum("amount"))
        return agg["s"] or 0

    @property
    def total_committed(self):
        """Funds already claimed by withdrawals — paid, in-flight, or queued for
        settlement — so they can't be requested twice."""
        agg = self.withdrawals.filter(
            status__in=["paid", "processing", "queued"]
        ).aggregate(s=Sum("amount"))
        return agg["s"] or 0

    @property
    def available_balance(self):
        return self.total_raised - self.total_committed


class StoryMoment(models.Model):
    """A 'how we met' timeline entry shown on the exhibition page."""
    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="moments")
    title = models.CharField(max_length=120)
    date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=moment_upload_to, max_length=255, null=True, blank=True)
    image_url = models.URLField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "date", "id"]

    def __str__(self):
        return self.title

    @property
    def display_image(self):
        if self.image:
            return self.image.url
        return self.image_url


class Tribute(models.Model):
    """A condolence / tribute message on a memorial event page (no payment needed)."""
    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="tributes")
    name = models.CharField(max_length=120)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Tribute by {self.name}"


class GalleryImage(models.Model):
    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to=gallery_upload_to, max_length=255, null=True, blank=True)
    image_url = models.URLField(blank=True)
    caption = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.caption or f"Gallery image {self.pk}"

    @property
    def display_image(self):
        if self.image:
            return self.image.url
        return self.image_url


class GuestUpload(models.Model):
    """A photo or short video posted by a visitor on a public event page.

    Auto-published: appears immediately; the host can delete anything unwanted
    from the dashboard. No login required for guests — name + caption optional.
    """
    IMAGE, VIDEO = "image", "video"
    MEDIA_TYPES = [(IMAGE, "Image"), (VIDEO, "Video")]

    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="guest_uploads")
    media = models.FileField(upload_to=guest_upload_to, storage=guest_media_storage, max_length=255)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default=IMAGE)
    uploader_name = models.CharField(max_length=120, blank=True)
    caption = models.CharField(max_length=200, blank=True)
    ip_hash = models.CharField(max_length=64, blank=True)  # salted hash, for abuse tracking
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        who = self.uploader_name or "A guest"
        return f"{self.media_type} by {who}"

    @staticmethod
    def detect_media_type(filename):
        import os
        ext = os.path.splitext(filename or "")[1].lower()
        return GuestUpload.VIDEO if ext in VIDEO_EXTS else GuestUpload.IMAGE

    @property
    def display_media(self):
        return self.media.url if self.media else ""


def gen_guest_token():
    return secrets.token_urlsafe(24)


class EventGuest(models.Model):
    """A person the host is inviting. Carries a unique token (personalised invite
    link + future door check-in) and a short human code as a fallback."""
    RSVP = [("pending", "Pending"), ("yes", "Attending"), ("no", "Declined")]
    # Unambiguous alphabet for the short code (no O/0, I/1, etc.)
    _CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="guests")
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    token = models.CharField(max_length=64, unique=True, default=gen_guest_token, editable=False)
    code = models.CharField(max_length=12, unique=True, editable=False)
    rsvp_status = models.CharField(max_length=10, choices=RSVP, default="pending")
    party_size = models.PositiveSmallIntegerField(default=1)
    invited_at = models.DateTimeField(null=True, blank=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    rsvp_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)  # Phase 2 (door check-in)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.registry})"

    def save(self, *args, **kwargs):
        if not self.code:
            while True:
                c = "".join(secrets.choice(self._CODE_ALPHABET) for _ in range(6))
                if not EventGuest.objects.filter(code=c).exists():
                    self.code = c
                    break
        super().save(*args, **kwargs)
