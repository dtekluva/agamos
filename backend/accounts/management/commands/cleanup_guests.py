"""Delete abandoned guest drafts: unclaimed accounts older than a week that
never received a real contribution. Keeps any guest whose event got money
(they'll be nudged to claim + verify in order to withdraw).

Run on a schedule (cron), e.g. daily:
    0 3 * * *  cd /opt/agamos/backend && /opt/agamos/venv/bin/python manage.py cleanup_guests
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from payments.models import Contribution

OLDER_THAN_DAYS = 7


class Command(BaseCommand):
    help = "Delete abandoned guest drafts (unclaimed, old, no successful contributions)."

    def handle(self, *args, **options):
        User = get_user_model()
        cutoff = timezone.now() - timedelta(days=OLDER_THAN_DAYS)
        guests = User.objects.filter(is_claimed=False, date_joined__lt=cutoff)

        deleted = kept = 0
        for u in guests:
            has_value = Contribution.objects.filter(
                gift__registry__owner=u, status="success"
            ).exists()
            if has_value:
                kept += 1
                continue
            u.delete()  # cascades to their registry/gifts/uploads
            deleted += 1

        self.stdout.write(self.style.SUCCESS(
            f"Guest cleanup: {deleted} deleted, {kept} kept (had contributions)."
        ))
