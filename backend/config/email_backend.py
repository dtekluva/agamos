import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class MailgunEmailBackend(BaseEmailBackend):
    """Send mail through Mailgun's HTTP API using MAILGUN_KEY + MAILGUN_DOMAIN.

    We use the HTTP API (not SMTP) because that's what the provided API key is for.
    Works with Django's normal send_mail / EmailMultiAlternatives, so existing
    callers keep working and HTML alternatives are forwarded as Mailgun `html`.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        api_key = getattr(settings, "MAILGUN_API_KEY", "")
        domain = getattr(settings, "MAILGUN_DOMAIN", "")
        base = getattr(settings, "MAILGUN_API_BASE", "https://api.mailgun.net/v3")
        if not (api_key and domain):
            if not self.fail_silently:
                raise RuntimeError("Mailgun not configured (MAILGUN_KEY / MAILGUN_DOMAIN).")
            return 0

        sent = 0
        for message in email_messages:
            data = {
                "from": message.from_email,
                "to": list(message.to),
                "subject": message.subject,
                "text": message.body,
            }
            if message.cc:
                data["cc"] = list(message.cc)
            if message.bcc:
                data["bcc"] = list(message.bcc)
            if message.reply_to:
                data["h:Reply-To"] = ", ".join(message.reply_to)
            for content, mimetype in getattr(message, "alternatives", []) or []:
                if mimetype == "text/html":
                    data["html"] = content
            try:
                resp = requests.post(
                    f"{base}/{domain}/messages",
                    auth=("api", api_key),
                    data=data,
                    timeout=15,
                )
                resp.raise_for_status()
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
