from django.contrib import admin

from .models import Contribution, Withdrawal


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ("guest_name", "gift", "amount", "status", "is_anonymous", "created_at")
    list_filter = ("status", "is_anonymous")
    search_fields = ("guest_name", "guest_email", "reference", "gift__title")
    readonly_fields = ("reference", "paystack_access_code", "created_at", "paid_at")


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ("registry", "amount", "status", "requested_at", "processed_at")
    list_filter = ("status",)
    search_fields = ("registry__partner_one_name", "registry__partner_two_name", "reference")
    actions = ["mark_paid", "mark_failed"]

    @admin.action(description="Mark selected withdrawals as paid")
    def mark_paid(self, request, queryset):
        from django.utils import timezone
        queryset.update(status="paid", processed_at=timezone.now())

    @admin.action(description="Mark selected withdrawals as failed")
    def mark_failed(self, request, queryset):
        queryset.update(status="failed")
