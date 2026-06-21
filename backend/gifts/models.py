from django.db import models
from django.db.models import Sum

from registries.models import Registry


def gift_upload_to(instance, filename):
    slug = getattr(instance.registry, "slug", "") or "misc"
    return f"agamos/{slug}/gifts/{filename}"


class Gift(models.Model):
    CATEGORY_CHOICES = [
        ("experience", "Experience"),
        ("home", "Home"),
        ("honeymoon", "Honeymoon"),
        ("nursery", "Nursery"),
        ("baby_essentials", "Baby essentials"),
        ("education", "Education fund"),
        ("party", "Party"),
        ("memorial_fund", "Memorial fund"),
        ("cash", "Cash fund"),
        ("charity", "Charity"),
        ("other", "Other"),
    ]
    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="gifts")
    title = models.CharField(max_length=140)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=gift_upload_to, max_length=255, null=True, blank=True)
    image_url = models.URLField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    allow_partial = models.BooleanField(default=True)
    is_cash_fund = models.BooleanField(default=False)
    show_progress = models.BooleanField(default=True)  # show the funding bar/amounts publicly
    sort_order = models.PositiveIntegerField(default=0)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def amount_raised(self):
        agg = self.contributions.filter(status="success").aggregate(s=Sum("amount"))
        return agg["s"] or 0

    @property
    def remaining(self):
        r = self.target_amount - self.amount_raised
        return r if r > 0 else 0

    @property
    def pct_funded(self):
        if not self.target_amount:
            return 0
        return min(100, round(float(self.amount_raised) / float(self.target_amount) * 100))

    @property
    def fully_funded(self):
        return self.amount_raised >= self.target_amount

    @property
    def display_image(self):
        if self.image:
            return self.image.url
        return self.image_url
