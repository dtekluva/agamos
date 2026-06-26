from decimal import Decimal

from django.conf import settings
from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from gifts.models import Gift
from registries.models import Registry
from .models import Contribution, Withdrawal
from .serializers import (
    ContributionInitSerializer, ContributionSerializer, WithdrawalSerializer,
)
from . import services
from config import emails

# How many stale records to reconcile against Paystack per list request (bounds latency).
_RECONCILE_CAP = 25


def _mark_guest_contributed(contribution):
    """If this (successful) contribution came from a personalised invite link, flag
    that guest as having contributed (for guest-list tracking). Never raises."""
    try:
        if contribution.status != "success":
            return
        g = contribution.guest
        if g and not g.contributed_at:
            g.contributed_at = timezone.now()
            g.save(update_fields=["contributed_at"])
    except Exception:
        pass


def _settle_amount(c, amount_kobo):
    """Set the contribution's gift-credited amount from what Paystack actually
    charged. When the giver covered the fee, back the fee out so the gift still
    only counts the intended amount. (In mock mode amount_kobo is None → no-op.)"""
    if amount_kobo:
        charged = Decimal(amount_kobo) / 100
        c.amount = (charged - c.card_fee) if c.fees_covered else charged


def _reconcile_contributions(qs):
    """Confirm still-pending contributions directly with Paystack (replaces the webhook).
    Catches cases where the guest closed the tab before the verify callback ran."""
    for c in qs.filter(status="pending").order_by("-created_at")[:_RECONCILE_CAP]:
        mapped, amount_kobo = services.verify_transaction(c.reference)
        if mapped == "success":
            c.status = "success"
            c.paid_at = timezone.now()
            _settle_amount(c, amount_kobo)
            c.save(update_fields=["status", "paid_at", "amount"])
            emails.notify_new_contribution(c)
            _mark_guest_contributed(c)
        elif mapped == "failed":
            c.status = "failed"
            c.save(update_fields=["status"])


def _is_unsettled(msg):
    m = (msg or "").lower()
    return "balance is not enough" in m or "insufficient" in m


def _reconcile_withdrawals(qs):
    """Confirm still-processing transfers directly with Paystack (replaces the webhook)."""
    for w in qs.filter(status="processing").order_by("-id")[:_RECONCILE_CAP]:
        mapped = services.verify_transfer(w.reference)
        if mapped in ("paid", "failed") and mapped != w.status:
            w.status = mapped
            if mapped == "paid":
                w.processed_at = timezone.now()
            w.save(update_fields=["status", "processed_at"])
            emails.notify_withdrawal(w)


def process_queued_withdrawals(qs):
    """Retry withdrawals that were queued because funds hadn't settled with Paystack.
    Sends them now if the balance is available; otherwise leaves them queued."""
    for w in qs.filter(status="queued").order_by("id")[:_RECONCILE_CAP]:
        reg = w.registry
        try:
            recipient = reg.paystack_recipient_code
            if not recipient:
                recipient = services.create_transfer_recipient(
                    name=reg.account_name or reg.couple_names,
                    account_number=reg.account_number,
                    bank_code=reg.bank_code or reg.bank_name,
                )
                reg.paystack_recipient_code = recipient
                reg.save(update_fields=["paystack_recipient_code"])
            result = services.initiate_transfer(
                amount_kobo=int((w.amount - w.fee) * 100), recipient_code=recipient,
                reason=f"Agamos payout — {reg.couple_names}", reference=w.reference,
            )
        except services.PaystackError as e:
            if _is_unsettled(str(e)):
                continue  # still not settled — keep it queued for the next run
            w.status = "failed"
            w.save(update_fields=["status"])
            emails.notify_withdrawal(w)
            continue
        paid = result.get("status") == "success"
        w.status = "paid" if paid else "processing"
        w.paystack_transfer_code = result.get("transfer_code", "")
        w.processed_at = timezone.now() if paid else None
        w.save(update_fields=["status", "paystack_transfer_code", "processed_at"])
        emails.notify_withdrawal(w)


class ContributionInitView(APIView):
    """Guest starts a gift contribution -> creates a pending Contribution and a
    Paystack transaction; returns the authorization_url to redirect the guest to."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = ContributionInitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        v = ser.validated_data
        gift = v["gift"]
        reference = services.gen_reference()
        email = v.get("guest_email") or "guest@agamos.app"

        # Reserved physical items can't be funded by a second guest (reserve-lock).
        if gift.kind == "item" and gift.is_reserved:
            raise ValidationError({"detail": "This gift has already been reserved."})

        # Attribute to an invited guest if they came via a personalised invite link.
        guest = None
        tok = (v.get("guest_token") or "").strip()
        if tok:
            from registries.models import EventGuest
            guest = EventGuest.objects.filter(token=tok, registry_id=gift.registry_id).first()

        # Giver-pays-the-fee: the gift still receives the intended amount, but we
        # charge the card the amount + card fee so nothing is lost to processing.
        amount = v["amount"]
        cover = v.get("cover_fees", False)
        card_fee = services.compute_card_fee(amount) if cover else Decimal("0")
        gross = amount + card_fee

        contribution = Contribution.objects.create(
            gift=gift,
            guest=guest,
            guest_name=v["guest_name"],
            guest_email=v.get("guest_email", ""),
            message=v.get("message", ""),
            is_anonymous=v["is_anonymous"],
            show_amount=v.get("show_amount", True),
            amount=amount,
            fees_covered=cover,
            card_fee=card_fee,
            reference=reference,
            status="pending",
        )
        # The frontend opens the Paystack Inline popup with this reference +
        # public key; Paystack creates the transaction, then we verify by reference.
        return Response(
            {
                "reference": reference,
                "public_key": settings.PAYSTACK_PUBLIC_KEY,
                "email": email,
                "amount": str(gross),            # what the card is charged (incl. covered fee)
                "gift_amount": str(amount),      # what counts toward the gift
                "card_fee": str(card_fee),
                "currency": gift.registry.currency,
                "mock": settings.PAYSTACK_MOCK_MODE,
            },
            status=201,
        )


class ContributionVerifyView(APIView):
    """Called from the thank-you page with ?reference= to confirm payment."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        reference = request.query_params.get("reference")
        if not reference:
            return Response({"detail": "reference is required"}, status=400)
        try:
            contribution = Contribution.objects.select_related(
                "gift", "gift__registry"
            ).get(reference=reference)
        except Contribution.DoesNotExist:
            return Response({"detail": "Contribution not found"}, status=404)

        if contribution.status == "pending":
            mapped, amount_kobo = services.verify_transaction(reference)
            if mapped == "success":
                contribution.status = "success"
                contribution.paid_at = timezone.now()
                # Trust the amount Paystack actually charged, not the client.
                _settle_amount(contribution, amount_kobo)
                contribution.save(update_fields=["status", "paid_at", "amount"])
                emails.notify_new_contribution(contribution)
                _mark_guest_contributed(contribution)
            elif mapped == "failed":
                contribution.status = "failed"
                contribution.save(update_fields=["status"])
        return Response(ContributionSerializer(contribution).data)


class ContributionListView(generics.ListAPIView):
    """Owner views who contributed to their registry's gifts."""
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        base = Contribution.objects.filter(gift__registry__owner=self.request.user)
        # Reconcile any still-pending payments with Paystack before listing.
        _reconcile_contributions(base)
        qs = base.select_related("gift")
        rid = self.request.query_params.get("registry")
        if rid:
            qs = qs.filter(gift__registry_id=rid)
        status_f = self.request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        return qs


class ContributionThankView(APIView):
    """Owner toggles whether they've thanked a contributor."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            c = Contribution.objects.select_related("gift__registry").get(
                pk=pk, gift__registry__owner=request.user
            )
        except Contribution.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        c.thanked = bool(request.data.get("thanked", not c.thanked))
        c.save(update_fields=["thanked"])
        return Response(ContributionSerializer(c).data)


class WithdrawalListCreateView(generics.ListCreateAPIView):
    """Couple requests a payout of their available balance to their bank (Paystack transfer)."""
    serializer_class = WithdrawalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        base = Withdrawal.objects.filter(registry__owner=self.request.user)
        # Retry queued payouts (settled now?) then confirm in-flight transfers.
        process_queued_withdrawals(base)
        _reconcile_withdrawals(base)
        qs = base
        rid = self.request.query_params.get("registry")
        if rid:
            qs = qs.filter(registry_id=rid)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        registry = serializer.validated_data["registry"]
        amount = serializer.validated_data["amount"]
        if registry.owner != user:
            raise PermissionDenied("Not your registry.")
        if amount < settings.MIN_WITHDRAWAL:
            raise ValidationError({"amount": f"Minimum withdrawal is {settings.MIN_WITHDRAWAL:,}."})
        if amount > registry.available_balance:
            raise ValidationError(
                {"amount": f"Exceeds available balance ({registry.available_balance})."}
            )
        if not (registry.account_number and (registry.bank_code or registry.bank_name)):
            raise ValidationError(
                {"detail": "Add your bank details before requesting a withdrawal."}
            )
        # KYC tier: receiving is uncapped, but unverified hosts can only withdraw up
        # to an all-time cap. Crossing it requires NIN + selfie verification.
        cumulative = Withdrawal.objects.filter(
            registry__owner=user, status__in=["paid", "processing", "queued"]
        ).aggregate(s=Sum("amount"))["s"] or 0
        if user.kyc_status != "verified" and (cumulative + amount) > settings.KYC_WITHDRAWAL_CAP:
            raise ValidationError({
                "detail": f"You can withdraw up to ₦{settings.KYC_WITHDRAWAL_CAP:,} before verifying your "
                          "identity. Verify with your NIN + a selfie to unlock unlimited withdrawals.",
                "kyc_required": True,
            })

        fee = services.compute_withdrawal_fee(amount)
        net = amount - fee
        reference = services.gen_reference("wd")
        try:
            recipient = registry.paystack_recipient_code
            if not recipient:
                recipient = services.create_transfer_recipient(
                    name=registry.account_name or registry.couple_names,
                    account_number=registry.account_number,
                    bank_code=registry.bank_code or registry.bank_name,
                )
                registry.paystack_recipient_code = recipient
                registry.save(update_fields=["paystack_recipient_code"])
            result = services.initiate_transfer(
                amount_kobo=int(net * 100),  # bank receives the net; platform keeps the fee
                recipient_code=recipient,
                reason=f"Agamos payout — {registry.couple_names}",
                reference=reference,
            )
        except services.PaystackError as e:
            msg = str(e)
            if _is_unsettled(msg):
                # Funds haven't settled with Paystack yet — queue it and send it
                # automatically once settlement lands (no failure shown to the host).
                w = serializer.save(reference=reference, fee=fee, status="queued")
                emails.notify_withdrawal(w)
                return
            serializer.save(reference=reference, fee=fee, status="failed")
            raise ValidationError({"detail": msg})

        paid = result.get("status") == "success"
        w = serializer.save(
            reference=reference,
            fee=fee,
            paystack_transfer_code=result.get("transfer_code", ""),
            status="paid" if paid else "processing",
            processed_at=timezone.now() if paid else None,
        )
        emails.notify_withdrawal(w)


class ResolveAccountView(APIView):
    """Confirm a payout account with Paystack (account number + bank code → name)
    so hosts can verify their bank details before requesting a withdrawal."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        account_number = (request.query_params.get("account_number") or "").strip()
        bank_code = (request.query_params.get("bank_code") or "").strip()
        if not (account_number and bank_code):
            return Response({"detail": "account_number and bank_code are required."}, status=400)
        try:
            name = services.resolve_account(account_number, bank_code)
        except services.PaystackError as e:
            return Response({"detail": str(e)}, status=400)
        return Response({"account_name": name})


class DashboardView(APIView):
    """Account-level dashboard summary across all the owner's registries."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        registries = Registry.objects.filter(owner=user)
        success = Contribution.objects.filter(gift__registry__owner=user, status="success")
        total_raised = success.aggregate(s=Sum("amount"))["s"] or 0
        total_withdrawn = (
            Withdrawal.objects.filter(registry__owner=user, status="paid")
            .aggregate(s=Sum("amount"))["s"] or 0
        )
        gifts = Gift.objects.filter(registry__owner=user, archived=False)
        gifts_funded = sum(1 for g in gifts if g.fully_funded)

        registries_detail = [
            {
                "id": r.id,
                "slug": r.slug,
                "couple_names": r.couple_names,
                "published": r.published,
                "gifts": r.gifts.filter(archived=False).count(),
                "total_raised": r.total_raised,
                "available_balance": r.available_balance,
            }
            for r in registries
        ]
        return Response(
            {
                "registries": registries.count(),
                "gifts": gifts.count(),
                "gifts_funded": gifts_funded,
                "contributions": success.count(),
                "total_raised": total_raised,
                "total_withdrawn": total_withdrawn,
                "available_balance": total_raised - total_withdrawn,
                "registries_detail": registries_detail,
                "recent_contributions": ContributionSerializer(
                    success.select_related("gift")[:8], many=True
                ).data,
            }
        )
