from django.contrib import admin

from .models import Gift


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = ("title", "registry", "category", "target_amount",
                    "amount_raised", "pct_funded", "is_cash_fund", "archived")
    list_filter = ("category", "is_cash_fund", "archived")
    search_fields = ("title", "registry__partner_one_name", "registry__partner_two_name")
