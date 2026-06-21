"""Paystack integration. Runs in MOCK mode when no secret key is configured so the
full contribution + withdrawal flow is demoable without live credentials."""
import hashlib
import hmac
import secrets

import requests
from django.conf import settings

PAYSTACK = settings.PAYSTACK_BASE_URL


class PaystackError(Exception):
    pass


def _headers():
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def gen_reference(prefix="agm"):
    return f"{prefix}_{secrets.token_hex(8)}"


# ---------- Transactions (contributions) ----------

def initialize_transaction(*, email, amount_kobo, reference, callback_url, metadata=None):
    if settings.PAYSTACK_MOCK_MODE:
        return {
            "mock": True,
            "authorization_url": f"{settings.FRONTEND_URL}/pay/mock?reference={reference}",
            "access_code": "mock_access_code",
            "reference": reference,
        }
    resp = requests.post(
        f"{PAYSTACK}/transaction/initialize",
        json={
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
            "callback_url": callback_url,
            "metadata": metadata or {},
        },
        headers=_headers(),
        timeout=20,
    )
    data = resp.json()
    if not data.get("status"):
        raise PaystackError(data.get("message", "Paystack initialization failed"))
    d = data["data"]
    return {
        "authorization_url": d["authorization_url"],
        "access_code": d["access_code"],
        "reference": d["reference"],
    }


def verify_transaction(reference):
    """Return (mapped_status, amount_kobo). mapped_status in success|pending|failed."""
    if settings.PAYSTACK_MOCK_MODE:
        return "success", None
    resp = requests.get(
        f"{PAYSTACK}/transaction/verify/{reference}", headers=_headers(), timeout=20
    )
    data = resp.json()
    if not data.get("status"):
        return "failed", None
    d = data["data"]
    raw = d.get("status")
    if raw == "success":
        return "success", d.get("amount")
    if raw in ("ongoing", "pending", "processing"):
        return "pending", d.get("amount")
    return "failed", d.get("amount")


def verify_signature(secret, body_bytes, signature):
    digest = hmac.new(secret.encode(), body_bytes, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature or "")


# ---------- Transfers (withdrawals) ----------

def create_transfer_recipient(*, name, account_number, bank_code):
    if settings.PAYSTACK_MOCK_MODE:
        return f"RCP_mock_{secrets.token_hex(4)}"
    resp = requests.post(
        f"{PAYSTACK}/transferrecipient",
        json={
            "type": "nuban",
            "name": name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": "NGN",
        },
        headers=_headers(),
        timeout=20,
    )
    data = resp.json()
    if not data.get("status"):
        raise PaystackError(data.get("message", "Could not create transfer recipient"))
    return data["data"]["recipient_code"]


def initiate_transfer(*, amount_kobo, recipient_code, reason, reference):
    if settings.PAYSTACK_MOCK_MODE:
        return {"status": "success", "transfer_code": f"TRF_mock_{secrets.token_hex(4)}"}
    resp = requests.post(
        f"{PAYSTACK}/transfer",
        json={
            "source": "balance",
            "amount": amount_kobo,
            "recipient": recipient_code,
            "reason": reason,
            "reference": reference,
        },
        headers=_headers(),
        timeout=20,
    )
    data = resp.json()
    if not data.get("status"):
        raise PaystackError(data.get("message", "Transfer failed"))
    d = data["data"]
    return {"status": d.get("status", "pending"), "transfer_code": d.get("transfer_code", "")}
