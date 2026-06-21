# Agamos — Multi-Event Expansion Plan

Extend Agamos beyond weddings to support **Wedding, Anniversary, Baby shower,
Birthday, and Memorial (burial)** events.

## Locked decisions
- **5 event types:** `wedding`, `anniversary`, `baby_shower`, `birthday`, `memorial`.
- **Two surfaces:** `registry` (gift grid — wedding/anniversary/baby/birthday) and
  `memorial` (memorial fund + tributes — burial).
- **Generic data, contextual labels** via a single config map (`lib/eventTypes.ts`).
- **Tokenised themes** that change hero, accents, CTA, progress fills, **page
  background, card fill & radius**; a default theme per event type.
- **Minimise schema churn:** keep DB columns (`partner_one_name`, `partner_two_name`,
  `wedding_date`); expose clean aliases `display_name` + `event_date` in the API and
  relabel contextually in the UI. Add only new columns where needed.
- Naming labels are contextual (NOT literally "hosts" everywhere):
  Wedding/Anniversary → Partners · Baby shower → Parents · Birthday → Celebrant
  (+ optional "Hosted by") · Memorial → "In loving memory of" + "Organised by / family".

## Themes (expanded, tokenised)
Blush & Gold (wedding) · Eternal — burgundy+gold (anniversary) · Nursery — pastel
mint/blue/pink (baby) · Confetti — coral/gold festive (birthday) · Memorial —
slate/ivory dignified (burial). Keep Midnight/Sage as optional palettes.

---

## Milestones

### M1 — Backend: model, migration, tributes, API
- `registries/models.py`: add `event_type`, `organiser_name`, `years_celebrated`,
  `turning_age`; `display_name` + `is_memorial` properties; single-name slug fix.
- New `Tribute` model (registry, name, message, created_at) for memorial condolences.
- `gifts/models.py`: expand categories (nursery, baby_essentials, education, party,
  memorial_fund).
- Serializers: expose new fields + `event_date` (source=wedding_date) + `display_name`;
  add `TributeSerializer`; public serializer includes `tributes`.
- `TributeViewSet` (AllowAny create, list-by-registry, owner delete) + route.
- Admin: `event_type` filter; register `Tribute`.
- Migration 0003 (existing rows default to wedding; data preserved).

### M2 — Frontend foundation
- `lib/eventTypes.ts` — single source of truth (labels, copy, date label, hero kicker,
  section labels, surface, defaultTheme, suggestedCategories). Drives creation flow,
  public page, AND landing "supported events" section.
- `lib/themes.ts` — extract + expand THEMES with `pageBg`, `cardBg`, `cardRadius`,
  `cardBorder` tokens + the 5 event themes.
- `lib/types.ts` — add event_type, organiser_name, event_date, years_celebrated,
  turning_age, display_name, is_memorial, tributes[].

### M3 — Creation flow
- `EventTypePicker.tsx` — "What are you celebrating?" 5 cards; sets type + default theme.
- `RegistrySettings.tsx` — config-driven labels, conditional second name / organiser /
  extra field, theme selector, memorial toggles (fund + show tributes).

### M4 — Public page (largest)
- `PublicRegistry.tsx` — all copy from config + `display_name`; apply theme tokens to
  page bg, card fill, radius, hero, accents, fills.
- Memorial variant: "In loving memory" hero, memorial-fund card, "Support the family"
  CTA, `TributeWall.tsx` (list + leave-a-tribute form → POST /api/tributes/).
- `ContributeModal.tsx` — copy from config.

### M5 — Landing page + dashboard copy
- **Landing:** CTAs "Create a registry" → **"Create an event"** (+ "Start your event",
  "Create your event — free"); generalise wedding-specific hero copy; new **"For every
  celebration"** section (Wedding 💍 · Anniversary 🥂 · Baby shower 🍼 · Birthday 🎉 ·
  Memorial 🕊️) sourced from `eventTypes`; event-neutral sample card.
- Dashboard: nav "Wedding page" → "Event page"; GiftBuilder categories from config;
  generic Overview copy.

### M6 — End-to-end verification
- Backend migrate/check; create one registry per type via API; tribute post; contribute
  (mock + live Paystack) on a memorial fund and a gift.
- Frontend build; live-drive creation per type; verify labels, default themes, public
  page per type; verify memorial tributes + fund. Screenshot each themed public page +
  the creation picker.

---

### M7 — Guest photo/video media wall (monetised) — ⏸ DEFERRED
A shared media wall where guests post photos/videos to the event page; gated as a
**premium / one-time per-event unlock** (never gate core gifting). Builds on the M4
gallery + tribute wall.

**Why deferred:** video adds real infra + cost (object storage, transcoding, CDN
bandwidth), needs moderation (approval queue, reporting, NSFW), and privacy/consent
handling — too much to bundle with the multi-event work.

**When picked up:**
1. Validate demand cheaply first (a "Guest album — coming soon / join waitlist /
   pre-order keepsake" stub) before building.
2. **Photos-first** via a managed host (Cloudinary/S3 + CDN), owner-moderated.
3. Add **video** later once the cost model is proven.
4. Add a `plan`/premium flag (User or Registry) to gate access; package as the flagship
   of a premium tier or a one-time event unlock.

Status: **Deferred — revisit after M1–M6 ship and there's paying-intent signal.**
