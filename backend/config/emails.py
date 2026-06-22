"""Transactional emails for Agamos.

Every sender here is best-effort: it must never raise into the request/payment
path, so failures are caught and logged. Sending goes through Django's mail
framework, which routes to the Mailgun backend when MAILGUN_KEY is configured.
"""
import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

log = logging.getLogger(__name__)

BRAND = "#A84D70"


def _wrap(heading, body_html, cta_text=None, cta_url=None):
    button = ""
    if cta_text and cta_url:
        button = (
            f'<a href="{cta_url}" style="display:inline-block;background:{BRAND};color:#fff;'
            "text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:600;"
            f'margin:22px 0;">{cta_text}</a>'
        )
    logo = getattr(settings, "EMAIL_LOGO_URL", "")
    brandmark = (
        f'<img src="{logo}" alt="Agamos" height="30" '
        'style="display:block;border:0;outline:none;text-decoration:none;margin-bottom:18px;">'
        if logo else
        f'<div style="font-size:22px;font-weight:700;color:{BRAND};margin-bottom:18px;">Agamos</div>'
    )
    return f"""\
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2A222F;">
  {brandmark}
  <h1 style="font-size:20px;margin:0 0 12px;">{heading}</h1>
  <div style="font-size:15px;line-height:1.6;color:#4a4350;">{body_html}</div>
  {button}
  <hr style="border:none;border-top:1px solid #E7DBD3;margin:24px 0;">
  <div style="font-size:12px;color:#6F6470;">Agamos — gift lists &amp; cash funds for every celebration.<br>
  If you weren’t expecting this email, you can safely ignore it.</div>
</div>"""


def _send(to, subject, text, html=None, reply_to=None, fail_silently=True):
    if not to:
        return 0
    recipients = [to] if isinstance(to, str) else list(to)
    msg = EmailMultiAlternatives(
        subject, text, settings.DEFAULT_FROM_EMAIL, recipients, reply_to=reply_to
    )
    if html:
        msg.attach_alternative(html, "text/html")
    return msg.send(fail_silently=fail_silently)


def _money(currency, amount):
    return f"{currency} {amount:,.0f}"


# --- Email verification (soft gate) -----------------------------------------

def verification_link(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"


def send_verification_email(user):
    """Welcome + verify-your-email. Used on signup and on resend."""
    try:
        if not user.email:
            return
        link = verification_link(user)
        name = (user.full_name or "").split(" ")[0] or "there"
        text = (
            f"Hi {name},\n\nWelcome to Agamos! Please confirm your email address to "
            f"verify your account — you'll need this before you can withdraw funds:\n\n"
            f"{link}\n\nIf you didn't sign up, you can ignore this email."
        )
        html = _wrap(
            "Welcome to Agamos 🎉",
            f"Hi {name}, thanks for joining! Please confirm your email address to verify "
            "your account. You'll need a verified email before you can withdraw funds.",
            "Verify my email",
            link,
        )
        _send(user.email, "Verify your Agamos email", text, html)
    except Exception:
        log.exception("verification email failed")


# --- Contributions -----------------------------------------------------------

def notify_new_contribution(contribution):
    """Email the host (a gift came in) and the guest (a receipt).

    Idempotent: only sends once, guarded by contribution.host_notified.
    """
    try:
        if contribution.host_notified or contribution.status != "success":
            return
        gift = contribution.gift
        reg = gift.registry
        amt = _money(reg.currency, contribution.amount)
        who = contribution.display_name

        # Host notification
        host_text = (
            f"Good news! {who} just contributed {amt} toward “{gift.title}”.\n\n"
            f"Log in to your Agamos dashboard to see it."
        )
        host_html = _wrap(
            "You received a gift 🎁",
            f"<b>{who}</b> just contributed <b>{amt}</b> toward “{gift.title}”."
            + (f"<br><br><i>“{contribution.message}”</i>" if contribution.message else ""),
            "View dashboard",
            f"{settings.FRONTEND_URL}/dashboard",
        )
        _send(reg.owner.email, f"🎁 {who} sent you {amt} on Agamos", host_text, host_html)

        # Guest receipt (only if they shared an email)
        if contribution.guest_email:
            g_text = (
                f"Thank you for your gift of {amt} toward “{gift.title}” for "
                f"{reg.couple_names}. Your generosity means a lot!"
            )
            g_html = _wrap(
                "Thank you for your gift 💝",
                f"Thank you for contributing <b>{amt}</b> toward “{gift.title}” for "
                f"<b>{reg.couple_names}</b>. Your generosity means a lot!",
            )
            _send(
                contribution.guest_email,
                f"Your gift to {reg.couple_names} — thank you!",
                g_text,
                g_html,
            )

        contribution.host_notified = True
        contribution.save(update_fields=["host_notified"])
    except Exception:
        log.exception("contribution notification failed")


# --- Withdrawals -------------------------------------------------------------

_WITHDRAWAL_COPY = {
    "queued": (
        "Your withdrawal is on the way",
        "We’ve received your withdrawal request for {amt}. Your funds are settling with "
        "our payment partner and will be sent to your bank automatically — usually within "
        "one business day. No action needed.",
    ),
    "paid": (
        "Your withdrawal has been paid ✅",
        "Your withdrawal of {amt} has been sent to your bank account. It should arrive shortly.",
    ),
    "failed": (
        "There was a problem with your withdrawal",
        "Your withdrawal of {amt} could not be completed. Please check your payout bank "
        "details in your dashboard and try again.",
    ),
}


def notify_withdrawal(withdrawal):
    """Email the host on a withdrawal status change.

    Idempotent: guarded by withdrawal.notified_status so each status emails once.
    """
    try:
        status = withdrawal.status
        if status not in _WITHDRAWAL_COPY or withdrawal.notified_status == status:
            return
        reg = withdrawal.registry
        amt = _money(reg.currency, withdrawal.amount)
        heading, body = _WITHDRAWAL_COPY[status]
        body = body.format(amt=amt)
        html = _wrap(
            heading, body, "Go to withdrawals",
            f"{settings.FRONTEND_URL}/dashboard/withdrawals",
        )
        _send(reg.owner.email, f"{heading} — Agamos", body, html)
        withdrawal.notified_status = status
        withdrawal.save(update_fields=["notified_status"])
    except Exception:
        log.exception("withdrawal notification failed")
