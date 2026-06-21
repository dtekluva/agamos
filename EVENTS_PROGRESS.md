# Multi-Event Build — Progress (loop tracker)

> Loop: each iteration, read this, do the next unchecked milestone, verify, tick it,
> update "Last iteration", schedule wakeup. Stop when M1–M6 all done. M7 is DEFERRED.
> Full spec: EVENTS_PLAN.md

- [x] M1 — Backend ✅ (verified all 5 types, event_date alias, memorial tribute + public view)
- [x] M2 — Frontend foundation ✅ (eventTypes config, themes tokens, types.ts; tsc clean)
- [x] M3 — Creation flow: EventTypePicker + config-driven RegistrySettings ✅ (verified memorial create)
- [x] M4 — Public page: event-aware + theme tokens + memorial surface + TributeWall ✅ (verified memorial+birthday+tribute post)
- [x] M5 — Landing ("Create an event" + "For every celebration") + dashboard copy + GiftBuilder categories ✅
- [x] M6 — End-to-end verification per type + screenshots ✅ — ALL DONE
- [⏸] M7 — Guest media wall (monetised) — DEFERRED

## Last iteration
- **M1 done.** Registry: event_type, organiser_name, years_celebrated, turning_age,
  show_tributes; display_name + is_memorial props; single-name slug; Tribute model.
  Gift categories expanded. Serializers expose new fields + event_date(source=wedding_date)
  alias + tributes (public respects show_tributes). TributeViewSet (AllowAny create, owner
  delete) at /api/tributes/. Admin updated. Migration 0003 applied. Verified all 5 types.
- **M2 done.** lib/eventTypes.ts (getEvent/EVENT_LIST — labels, copy, default theme,
  suggestedCategories per type). lib/themes.ts (getTheme/THEME_LIST — tokens incl pageBg,
  cardBg, cardRadius, cardBorder; 5 event themes + midnight/sage). types.ts updated.
  vite-env.d.ts added. Fixed wedding_date→event_date in Overview/RegistrySettings/Public.
  tsc --noEmit clean + build green.
- **M3 done.** EventTypePicker.tsx (5 cards → sets event_type + default theme). RegistrySettings
  rewritten config-driven: shows picker when isNew & no type; contextual name labels, hide 2nd
  name/organiser, date label, years/age extra field, relabeled toggles (+ Tribute wall for
  memorial), full THEME_LIST, "Change type". Verified memorial create end-to-end.
- **M4 done.** PublicRegistry rewritten: getEvent (copy) + getTheme (pageBg/cardBg/
  cardRadius/cardBorder applied to page, cards, gallery, timeline, fills). Memorial surface:
  "In loving memory" hero, organiser line, "Support the family" fund, Service details,
  TributeWall.tsx (leave-a-tribute → POST /api/tributes/, newest-first). ContributeModal
  takes heading/actionWord props. Verified memorial (slate/ivory + tribute post 2→3),
  birthday (confetti). Test slugs: chief-adaeze-obi-bd6e, zara-3ea0.
- **M5 done.** Landing: nav/hero/final CTAs → "Create an event"/"Start your event"/"Create
  your event — free"; generalised hero copy; "For every celebration" section (5 cards from
  EVENT_LIST); generalised how-it-works + features. Dashboard nav "Wedding page"→"Event page".
  GiftBuilder: categories from cfg.suggestedCategories + catLabel, memorial reframe (Memorial
  funds / "fund"). Overview: display_name + generic copy. All dashboard empty states →
  "Create your event". Verified via DOM (CTAs + 5 event cards) + build/tsc clean.
- **M6 done — MULTI-EVENT EXPANSION COMPLETE.** Verified all 5 types create with correct
  event_type/theme/display_name/gifts; live Paystack mode active for all; memorial tribute
  post + fund; anniversary "Eternal" theme screenshot confirmed distinct. Build + tsc clean.

## ✅ ALL MILESTONES COMPLETE (M1–M6). M7 (media wall) remains DEFERRED.
Agamos now supports Wedding, Anniversary, Baby shower, Birthday, and Memorial — each with
contextual creation flow, its own theme (bg/cards/fills), event-aware public page, and the
memorial gets a fund + tribute wall. Landing + dashboard fully multi-event. Loop STOPPED.

## Notes / live test setup
- Backend preview: `agamos-backend` (8000). Frontend: `agamos-frontend` (5173).
- Paystack live test keys are in backend/.env. Admin: admin@agamos.app / agamos-admin-2026.
- Inputs use class `.input`. Toast: [role=status]. Success toasts wired on all forms.
