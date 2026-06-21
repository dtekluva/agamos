"""Send any withdrawals that were queued because funds hadn't settled with Paystack.

Run on a schedule (cron), e.g. hourly:
    */30 * * * *  cd /opt/agamos/backend && /opt/agamos/venv/bin/python manage.py process_queued_withdrawals
"""
from django.core.management.base import BaseCommand

from payments.models import Withdrawal
from payments.views import process_queued_withdrawals, _reconcile_withdrawals


class Command(BaseCommand):
    help = "Retry queued payouts (funds settled?) and confirm in-flight transfers."

    def handle(self, *args, **options):
        queued = Withdrawal.objects.filter(status="queued")
        n_queued = queued.count()
        process_queued_withdrawals(Withdrawal.objects.all())
        _reconcile_withdrawals(Withdrawal.objects.all())
        sent = n_queued - Withdrawal.objects.filter(status="queued").count()
        self.stdout.write(self.style.SUCCESS(
            f"Processed queue: {n_queued} queued, {sent} sent/advanced."
        ))
