# Agamos — Build Progress & Loop Protocol

> This file is the source of truth for the self-paced build loop. Each iteration:
> 1. Read this file. 2. Do the next unchecked milestone/chunk. 3. Verify it.
> 4. Update the checkboxes + "Last iteration" note. 5. Schedule the next wakeup.
> Stop the loop (omit ScheduleWakeup) only when **all** milestones are checked and
> the app runs end-to-end.

## Start prompt (the instruction this loop follows)

"Build the Agamos wedding-gifting platform exhaustively: Django + DRF backend
(JWT auth, registries, gifts, contributions via Paystack, withdrawals, admin) and a
React (Vite + Tailwind) frontend using the berry/rose/gold design system. Include the
public shareable registry page with an exhibition section (couple's hero message,
'how we met' timeline, gallery, event details — all driven by the couple's config),
a couple dashboard (gift builder, exhibition editor, contributions, withdrawals),
sign-up/login, and Paystack payments with a mock mode when keys are absent. Build,
run, and verify each piece. Keep going until the whole platform works."

## Milestones

- [x] M1 — Backend scaffold: project `config`, apps, models, admin, migrations applied, `manage.py check` clean ✅
- [x] M2 — Auth (JWT) + registries/gifts API + serializers ✅
- [x] M3 — Public registry API + contributions (Paystack init/verify/webhook, mock mode) ✅
- [x] M4 — Withdrawals + dashboard stats endpoint + admin polish ✅ (backend complete)
- [x] M5 — Frontend scaffold (Vite, Tailwind tokens, router, auth context, api client) ✅
- [x] M6 — Landing ✅ · auth pages (SignUp/Login) + AuthShell + ProtectedRoute ✅ (rendered & verified)
- [x] M7 — Dashboard: layout + overview + registry settings + gift builder ✅ (verified live full-stack)
- [x] M8 — Exhibition editor + public registry page (exhibition + gifts) ✅ (verified live)
- [x] M9 — Contribute / checkout (Paystack mock + real redirect) ✅ (verified live) · thank-you page pending for real-key redirect path
- [x] M10 — Thank-you page + Contributions list + Withdrawals UI + end-to-end run ✅ (verified live)
- [x] M11 — **Deployment prep (droplet + nginx)** ✅ — gunicorn config, systemd unit,
  nginx site (SPA + /api + /admin + /static + /media), WhiteNoise static, production
  settings hardening (DEBUG/HSTS/SSL/CSRF from env), requirements.txt, .env.production,
  DEPLOY.md guide. `collectstatic` + `check --deploy` verified. (Final on-droplet verify
  happens once the frontend build exists, M5/M10.)

## Last iteration
- **M1 done.** Scaffolded Django backend in `backend/`: project `config`, apps
  `accounts` (custom email User), `registries` (Registry + StoryMoment + GalleryImage,
  exhibition config + bank/withdrawal fields), `gifts` (Gift w/ funding props),
  `payments` (Contribution, Withdrawal). Admin registered for all. Migrations applied,
  `manage.py check` clean. Superuser: admin@agamos.app / agamos-admin-2026. Health +
  admin verified booting on a smoke port.
- **M2 done.** JWT auth (register/login/refresh/me via simplejwt, email login),
  RegistryViewSet (owner-scoped), GiftViewSet, StoryMoment/Gallery viewsets,
  IsOwnerOrReadOnly permission, PublicRegistrySerializer (no bank details, respects
  exhibition toggles) at `GET /api/r/<slug>`. Router wired in `config/api.py`. Verified
  full flow: register→login→create registry→add gift→public view→401 on unauth write.
- **M3 done.** Paystack service layer (`payments/services.py`) with MOCK mode +
  transactions (init/verify/signature) + transfers (recipient/transfer for M4).
  Contribution endpoints: `POST /contributions/init`, `GET /contributions/verify`,
  `POST /paystack/webhook`, `GET /contributions` (owner). Verified full flow: guest
  funds a gift → gift progress + registry balance update → owner sees contribution.
- **Also done out-of-band: M11 deployment prep** (gunicorn/systemd/nginx/DEPLOY.md +
  prod settings; collectstatic + check --deploy verified).
- **M4 done — BACKEND COMPLETE.** Withdrawals (`GET/POST /withdrawals`): balance guard,
  bank-detail check, Paystack transfer recipient + transfer (mock), transfer.success
  webhook → paid. Dashboard (`GET /dashboard`): totals, gift/funded counts, per-registry
  detail, recent contributions. Admin: mark-paid/failed actions. Added `bank_code` field.
  Verified: over-withdraw 400, valid withdraw 201→paid, balances recompute.
- **M5 done.** Manually scaffolded Vite + React 18 + TS + Tailwind 3 in `frontend/`
  (create-vite choked on the spaced path). Design tokens in `tailwind.config.js`
  (berry/rose/gold), `index.css` w/ Playfair+Inter + component classes (.btn-*, .card,
  .input, .progress, .chip). `lib/api.ts` (axios + JWT interceptor), `lib/auth.tsx`
  (AuthProvider/useAuth), `lib/types.ts`, `lib/format.ts` (money/date). Router in
  App.tsx, polished Landing page. `npm run build` ✅ (89 modules); CSS has brand tokens,
  JS has app content. NOTE: preview sandbox currently can't serve local servers (tooling),
  so verified via build artifacts not screenshot — revisit visual check when sandbox recovers.
- **M6 done.** AuthShell (split brand/form layout), Login + SignUp pages wired to JWT
  API w/ error handling, ProtectedRoute (redirects to /login), Dashboard stub, routes in
  App.tsx. Build clean (94 modules). **Visually verified** (sandbox recovered): landing
  + SPA routing + signup form all render with the design system.
- **M7 done.** `lib/registry.tsx` (RegistryProvider/useRegistry — loads list, active
  registry, create/update/reload). DashboardLayout (sticky nav + sidebar). Overview
  (stats from /api/dashboard, recent contributions, quick actions, empty state).
  RegistrySettings (full create/edit: couple, public page, exhibition toggles, bank).
  GiftBuilder (list w/ progress, add/edit/archive inline form). Nested routes in App.tsx
  under ProtectedRoute+RegistryProvider; ComingSoon stubs for exhibition/contributions/
  withdrawals. **Verified LIVE full-stack** (vite 5173 + Django 8000 via preview):
  signup→dashboard→create registry→add gift, all persisted & rendered.
- **LIVE TEST SETUP (reuse this!):** preview launch configs `agamos-backend` (sh -c cd
  backend && runserver 8000) + `agamos-frontend` (vite 5173). Browser reaches both;
  CORS allows 5173. Drive with preview_fill/click. Inputs use class `.input` (no type attr).
- **M8 + M9 done (mostly).** PublicRegistry `/r/:slug` — full exhibition (hero w/ cover,
  our story, how-we-met timeline, gallery, event details, gift grid), all driven by
  show_* toggles. ContributeModal: init → mock-verify (or real Paystack redirect) →
  success; gift funding updates. Exhibition editor (dashboard) for moments + gallery CRUD.
  Routes wired. **Verified LIVE**: viewed /r/ada-and-tunde, contributed ₦250k via modal,
  saw "Thank you" + bar move to 25%.
- **M10 done — PLATFORM COMPLETE.** ThankYou page (`/r/:slug/thank-you?reference=`,
  calls verify), Contributions dashboard (table + total), Withdrawals UI (balance cards +
  request form + history). All routes wired. **Verified LIVE end-to-end**: contribution
  (₦150k from Aunty Ngozi) shows in dashboard; withdrawal ₦50k → paid, balance recalcs to
  ₦100k available; thank-you page confirms a gift.

## ✅ ALL MILESTONES COMPLETE (M1–M11)
Backend (Django+DRF): auth/JWT, registries, gifts, public registry, Paystack
contributions, withdrawals, dashboard, admin. Frontend (React+Vite+Tailwind): landing,
auth, dashboard (overview/registry/gifts/exhibition/contributions/withdrawals), public
exhibition page, contribute modal, thank-you. Deployment: gunicorn+nginx+DEPLOY.md.
Loop STOPPED — build finished.

## API surface (built)
- auth: POST /api/auth/register · /login · /refresh · GET /me
- registries: CRUD /api/registries/ · public GET /api/r/<slug>
- gifts: CRUD /api/gifts/ · moments /api/moments/ · gallery /api/gallery/
- payments: POST /api/contributions/init · GET /contributions/verify · GET /contributions
  · POST /withdrawals · GET /withdrawals · GET /dashboard · POST /paystack/webhook
- Backend run: `cd backend && python3 manage.py runserver` (admin admin@agamos.app / agamos-admin-2026)

## Run notes
- Backend: `cd backend && python3 manage.py runserver 0.0.0.0:8000`
- Frontend: `cd frontend && npm run dev` (Vite, port 5173)
- Paystack: set `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` in `backend/.env`; mock mode if unset.
