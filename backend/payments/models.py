from django.db import models

from gifts.models import Gift
from registries.models import Registry


class Contribution(models.Model):
    STATUS = [("pending", "Pending"), ("success", "Success"), ("failed", "Failed")]

    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name="contributions")
    guest_name = models.CharField(max_length=120)
    guest_email = models.EmailField(blank=True)
    message = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS, default="pending")
    thanked = models.BooleanField(default=False)
    reference = models.CharField(max_length=80, unique=True)
    paystack_access_code = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.guest_name} -> {self.gift.title} ({self.amount})"

    @property
    def display_name(self):
        return "Someone" if self.is_anonymous else self.guest_name


class Withdrawal(models.Model):
    STATUS = [
        ("requested", "Requested"),
        ("queued", "Queued"),        # awaiting Paystack settlement; retried automatically
        ("processing", "Processing"),
        ("paid", "Paid"),
        ("failed", "Failed"),
    ]
    registry = models.ForeignKey(Registry, on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=12, choices=STATUS, default="requested")
    reference = models.CharField(max_length=80, blank=True)
    paystack_transfer_code = models.CharField(max_length=80, blank=True)
    note = models.CharField(max_length=200, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self):
        return f"{self.registry} withdrawal {self.amount} ({self.status})"
