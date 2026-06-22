"""Send the heartfelt appreciation/welcome email to new users — once each.

Idempotent via User.appreciation_sent, so it never re-emails anyone (avoids
clutter). Skips users who signed up in the last few hours so it doesn't land on
top of the signup verification email — it arrives as a warm follow-up instead.

Run on a schedule (cron), e.g. daily:
    0 9 * * *  cd /opt/agamos/backend && /opt/agamos/venv/bin/python manage.py send_appreciation
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from config import emails

# Wait this long after signup before sending, so it doesn't stack on the
# verification email a user gets the moment they register.
MIN_AGE_HOURS = 6


class Command(BaseCommand):
    help = "Email the appreciation/welcome campaign to new users who haven't received it."

    def add_arguments(self, parser):
        parser.add_argument(
            "--now", action="store_true",
            help="Ignore the signup age gate (send to all un-emailed users immediately).",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        qs = User.objects.filter(appreciation_sent=False).exclude(email="").exclude(email__isnull=True)
        if not options.get("now"):
            cutoff = timezone.now() - timedelta(hours=MIN_AGE_HOURS)
            qs = qs.filter(date_joined__lte=cutoff)

        users = list(qs.order_by("id"))
        sent = failed = 0
        for u in users:
            try:
                emails.send_appreciation_email(u)
                User.objects.filter(pk=u.pk).update(appreciation_sent=True)
                sent += 1
            except Exception as e:  # noqa: BLE001 — keep going if one address fails
                failed += 1
                self.stderr.write(f"FAIL {u.email}: {e!r}"[:200])

        self.stdout.write(self.style.SUCCESS(
            f"Appreciation campaign: {sent} sent, {failed} failed, {len(users)} eligible."
        ))
