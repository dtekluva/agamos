# Agamos — Build Plan (Full Platform)

A wedding gifting platform: couples build a registry of gifts & cash goals, publish a
beautiful public page (exhibition: their story, "how we met", gallery, event details),
and friends/well-wishers fund or fully buy gifts — paying via **Paystack**. Couples
withdraw raised funds to their bank. Includes auth/sign-up, a couple dashboard, an
admin, and withdrawals.

## Architecture

- **Backend:** Django + Django REST Framework
  - Auth: JWT (djangorestframework-simplejwt), email sign-up/login
  - DB: SQLite (dev)
  - Payments: Paystack (initialize → redirect → verify + webhook); Transfers for withdrawals
  - Media: ImageField uploads (cover, gallery, gift images) served in dev
  - Admin: Django admin for platform oversight
- **Frontend:** React + Vite + TypeScript + Tailwind
  - Design system: berry/rose/gold tokens (see DESIGN_SYSTEM.md), Playfair Display + Inter
  - Routing: react-router; data: axios + react-query (or fetch)
- **Repo layout**
  - `backend/` — Django project (`config`) + apps `accounts`, `registries`, `gifts`, `payments`
  - `frontend/` — Vite React app
  - existing `index.html` marketing page → folded into React landing

## Data model

- **accounts.User** — custom user, email login (couple account owner)
- **registries.Registry** — owner FK; slug (public URL); partner names; wedding date, venue, city;
  cover image; hero_message; our_story (how we met); exhibition toggles
  (show_story, show_gallery, show_event_details, theme); currency; bank details
  (bank_name, account_number, account_name, paystack_recipient_code); published
- **registries.StoryMoment** — registry FK; title; date; description; image (the "how we met" timeline)
- **registries.GalleryImage** — registry FK; image; caption; sort_order
- **gifts.Gift** — registry FK; title; description; image; category; target_amount;
  allow_partial; is_cash_fund; sort_order; archived
  - computed: amount_raised, pct_funded, fully_funded, remaining
- **payments.Contribution** — gift FK; guest_name; guest_email; message; is_anonymous;
  amount; status (pending/success/failed); paystack_reference; created_at, paid_at
- **payments.Withdrawal** — registry FK; amount; status (requested/processing/paid/failed);
  paystack_transfer_code; reference; requested_at, processed_at

## API (DRF)

- `POST /api/auth/register`, `POST /api/auth/login` (JWT), `GET /api/auth/me`
- `GET/POST /api/registries`, `GET/PATCH/DELETE /api/registries/{id}` (owner)
- `GET /api/r/{slug}` — public registry + exhibition + gifts (no auth)
- `GET/POST /api/registries/{id}/gifts`, gift detail CRUD
- StoryMoment & GalleryImage nested CRUD
- `POST /api/contributions/init` — start Paystack payment (returns authorization_url)
- `GET /api/contributions/verify?reference=` — verify + mark success
- `POST /api/paystack/webhook` — charge.success
- `GET /api/registries/{id}/contributions` — owner views who gave what
- `POST /api/registries/{id}/withdrawals`, `GET .../withdrawals`
- Dashboard stats endpoint (totals raised, funded count, pending withdrawals)

## Frontend pages

1. **Landing** (marketing — reuse current design, animated gift-card stack)
2. **Sign up / Log in**
3. **Dashboard** (couple): overview stats; registry settings; **gift builder**;
   **exhibition editor** (story, how-we-met timeline, gallery, event details, toggles);
   **contributions** list; **withdrawals**
4. **Public registry** `/r/{slug}`: exhibition (hero, our story, how-we-met timeline,
   gallery, event details — all driven by the couple's config) + gift grid with progress + Contribute
5. **Contribute / checkout** → Paystack → **Thank-you** page
6. **Django admin** for platform admin

## Payment flow (Paystack)

1. Guest clicks Contribute on a gift → enters name, amount, message
2. Backend `contributions/init` creates a pending Contribution + Paystack transaction → returns `authorization_url`
3. Guest pays on Paystack → redirected back to `/r/{slug}/thank-you?reference=...`
4. Frontend calls `verify` → backend confirms with Paystack → Contribution = success → gift progress updates
5. Webhook `charge.success` as the source of truth (idempotent)
6. **Withdrawals:** couple adds bank details → create Paystack transfer recipient →
   request withdrawal → Paystack Transfer → status tracked

Keys read from env (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`); a **mock mode**
activates when keys are absent so the flow is fully demoable without live keys.

## Milestones (tracked in BUILD_PROGRESS.md)

M1 Backend scaffold + models + admin + migrations
M2 Auth (JWT) + registries/gifts API + serializers
M3 Public registry API + contributions (Paystack init/verify/webhook, mock mode)
M4 Withdrawals + dashboard stats + admin polish
M5 Frontend scaffold (Vite, Tailwind tokens, routing, auth context)
M6 Landing + auth pages
M7 Dashboard: registry settings + gift builder
M8 Exhibition editor + public registry page (exhibition + gifts)
M9 Contribute/checkout + thank-you (Paystack)
M10 Withdrawals UI + polish + end-to-end run & verify
