# Agamos — Project Brief

**A wedding gifting platform where couples build a wish list and well-wishers fund or purchase the gifts.**

*Version 1.0 · 15 June 2026 · Status: Draft for review*

---

## 1. Overview

Agamos is a web and mobile platform that lets engaged couples create a shared
wedding wish list and invite friends, family, and well-wishers to contribute
toward — or fully fund — the items on it. Instead of receiving duplicate or
unwanted gifts, couples receive exactly what they want, and guests get a simple,
trusted way to give something meaningful, even from a distance.

The core idea: **every gift becomes a fundable goal.** A guest can buy a whole
item, chip in a partial amount toward something larger (a honeymoon, a fridge, a
deposit on a home), or contribute to a general cash fund.

---

## 2. Problem & Opportunity

- Traditional gift registries are tied to a single retailer and limited to
  physical products.
- Cash gifting is common but awkward, untracked, and feels impersonal.
- Guests who can't attend (or live abroad) lack an easy, secure way to give.
- Couples end up with duplicates, returns, and no easy way to say thank you.

**Opportunity:** a single, retailer-agnostic platform that blends a wish list,
group funding, and cash gifts — with the trust, tracking, and personal touch
that existing tools lack.

---

## 3. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Couples create complete wish lists | Avg. items per registry ≥ 12 |
| Guests convert to contributors | Visitor → contribution rate ≥ 25% |
| Group funding works | % of high-value items fully funded ≥ 60% |
| Trust in payouts | Couple payout completion ≥ 99% |
| Delight | NPS ≥ 50 from couples and guests |

---

## 4. Target Users

- **The Couple (registry owners)** — building their list, sharing it, tracking
  contributions, and withdrawing funds or redeeming items.
- **Guests / Well-wishers** — browsing the list, picking a gift, paying, and
  leaving a personal message.
- **Group contributors** — several guests funding one expensive item together.

---

## 5. Core Features (MVP)

### For the couple
1. **Registry builder** — add items manually, from a URL, or from a curated
   catalog. Each item has a name, photo, description, price, and quantity.
2. **Fundable goals** — mark any item as fully-funded-only or open to partial
   contributions; set cash funds (honeymoon, home deposit, charity).
3. **Wedding page** — a shareable, branded page with the couple's story, photos,
   event details, and the wish list.
4. **Contribution dashboard** — see who gave what, funding progress per item,
   and total raised.
5. **Payouts & redemption** — withdraw cash to a bank account or redeem funded
   items as vouchers/orders.
6. **Thank-you tools** — track which guests to thank; send messages in-app.

### For guests
7. **Browse & gift** — view the list, see what's still needed, pick an item.
8. **Pick or fund** — buy an item outright or contribute any amount toward a
   goal; join a group gift.
9. **Personal message** — attach a note and optionally a photo to the gift.
10. **Guest checkout** — pay securely without creating an account.

---

## 6. Key User Flows

**Couple onboarding:** sign up → create wedding page → build wish list → set
funding rules → share link.

**Guest gifting:** open link → browse list → select item → choose full purchase
or partial contribution → pay → leave message → receive confirmation.

**Group gift:** first guest starts funding a high-value item → progress bar
shows remaining → others top it up → item marked funded → couple notified.

**Payout:** couple verifies identity → links bank account → requests withdrawal
or redeems item → funds disbursed.

---

## 7. Out of Scope (for MVP)

- Native physical fulfilment / Agamos-managed inventory (use retailer links and
  vouchers instead).
- Multi-event support (baby showers, anniversaries) — phase 2.
- Vendor marketplace and ads.
- Full social feed / commenting beyond gift messages.

---

## 8. Technical Considerations

- **Payments:** integrate a PSP supporting cards, bank transfer, and mobile
  money; handle partial/group contributions and escrow until payout.
- **Trust & safety:** identity verification (KYC) for payouts, fraud monitoring,
  and clear refund/cancellation rules.
- **Architecture:** web-first responsive app + mobile; shareable public registry
  pages with SEO-friendly URLs.
- **Notifications:** email/SMS/push for contributions, funding milestones, and
  thank-you reminders.
- **Privacy:** couples control what guest contribution amounts are public.

---

## 9. Monetisation Options

- Small platform fee on cash contributions (transparent, optional "cover the
  fee" toggle for guests).
- Affiliate revenue from catalog/retailer purchases.
- Premium wedding pages (custom domains, themes, video).

---

## 10. Phased Roadmap

| Phase | Focus |
|-------|-------|
| **Phase 1 — MVP** | Registry builder, fundable goals, guest checkout, payouts, thank-you tracking |
| **Phase 2** | Group-gift enhancements, mobile apps, themes, multi-currency |
| **Phase 3** | Multi-event support, vendor marketplace, AI gift suggestions |

---

## 11. Open Questions

- Which markets/currencies launch first, and which PSP fits them best?
- Escrow model: hold funds until the wedding date, or release on demand?
- How are partially funded items handled if a goal isn't met (refund vs. cash)?
- Default fee structure and who absorbs it.

---

*Agamos — give what they truly wish for.*
