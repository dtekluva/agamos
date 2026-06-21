# Agamos — Design System

**Direction:** Romantic blush + gold. Warm and wedding-special, but trustworthy enough
for a platform that moves real money. Gold is a **deliberate accent**, never the
workhorse — the functional UI (text, buttons, forms) rests on a dark plum-ink neutral so
everything stays legible and accessible.

**Stack:** Tailwind CSS + shadcn/ui, themed with the tokens below.

---

## 1. Brand principles

1. **Romantic, not corporate** — serif headlines, soft shapes, warm tones.
2. **Trust first** — this is a payments product. Contrast, clarity, and calm win over decoration.
3. **Gold is a jewel, not paint** — used on accents, dividers, progress, icons, and celebratory moments only.
4. **The funding bar is the hero component** — every gift is a goal; show progress beautifully and everywhere.
5. **One couple, many guests** — the system must feel personal for couples and frictionless for guests.

---

## 2. Color tokens

### Brand
| Token | Hex | Use |
|-------|-----|-----|
| `berry` (primary) | `#6D2E46` | Primary buttons, headings, key UI |
| `berry-deep` | `#52203440`→`#521F33` | Hovers, gradients, dark panels |
| `rose` | `#C8688A` | Secondary accent, gradients |
| `rose-deep` | `#A84D70` | Secondary buttons, links on light |

### Gold (accent only)
| Token | Hex | Use |
|-------|-----|-----|
| `gold` | `#B98A2E` | Accent text/icons on **light** bg (passes contrast) |
| `gold-light` | `#D9A86C` | Decorative / large elements / on **dark** bg |
| `champagne` | `#EBCFA8` | Small labels on dark berry (legible) |

> **Rule:** never set body text in `gold` on a light background, and never use `champagne`
> on cream. Gold is for accents, dividers, progress fills, and icons — not paragraphs.

### Neutrals (the functional workhorse)
| Token | Hex | Use |
|-------|-----|-----|
| `ink` | `#2A222F` | Body text, functional buttons, form labels |
| `muted` | `#6F6470` | Secondary text, captions |
| `line` | `#E7DBD3` | Borders, dividers |
| `soft` | `#F3E7DF` | Section backgrounds, chips, icon circles |
| `cream` | `#FBF6F1` | Page background |
| `white` | `#FFFFFF` | Cards, surfaces |

### Semantic
| Token | Hex | Use |
|-------|-----|-----|
| `success` | `#2E7D5B` | Funded goals, confirmations |
| `warning` | `#B98A2E` | Pending payouts, attention |
| `error` | `#B23A48` | Failures, validation |
| `info` | `#50808E` | Neutral notices |

### Gradients
- **Primary CTA:** `linear-gradient(135deg, #C8688A, #A84D70)`
- **Progress fill:** `linear-gradient(90deg, #D9A86C, #C8688A)` (gold→rose — the signature look)
- **Hero blush:** `linear-gradient(135deg, #F3D9C8, #E7B7C9)`

---

## 3. Typography

| Role | Font | Fallback |
|------|------|----------|
| Display / headings | **Playfair Display** (serif) | Georgia, serif |
| Body / UI | **Inter** (sans) | -apple-system, Segoe UI, sans |
| Numerals (amounts) | Inter, tabular-nums | — |

### Scale
| Token | Size / line-height | Weight | Use |
|-------|-------------------|--------|-----|
| `display` | 48 / 1.1 | 600 | Hero headline |
| `h1` | 36 / 1.15 | 600 | Page titles |
| `h2` | 28 / 1.2 | 600 | Section heads |
| `h3` | 22 / 1.25 | 600 | Card titles |
| `h4` | 18 / 1.3 | 600 | Sub-heads |
| `body-lg` | 18 / 1.55 | 400 | Lead paragraphs |
| `body` | 16 / 1.55 | 400 | Default text |
| `small` | 14 / 1.5 | 400 | Secondary |
| `caption` | 12 / 1.4 | 500 | Labels, eyebrows (use letter-spacing) |

**Eyebrow labels:** uppercase, 12–13px, letter-spacing ~0.08em, in `rose-deep` (light bg) or `champagne` (dark bg).

---

## 4. Spacing, radius, elevation

**Spacing scale (4px base):** `4, 8, 12, 16, 24, 32, 48, 64, 96`
- Card padding: 24–32px · Section vertical rhythm: 64–96px · Gaps between cards: 24px

**Radius:** `sm 8` (inputs) · `md 14` (cards) · `lg 18` (feature cards/hero) · `pill 999` (buttons, chips, progress)

**Shadows (berry-tinted, soft):**
- `sm`: `0 4px 14px rgba(109,46,70,.07)`
- `md`: `0 8px 28px rgba(109,46,70,.10)`
- `lg`: `0 18px 50px rgba(109,46,70,.14)`

---

## 5. Core components

- **Buttons**
  - *Primary:* berry/rose gradient, white text, pill, `shadow-md`. Hover: lift 2px.
  - *Secondary:* transparent, 1.5px `rose` border, `rose-deep` text. Hover: fill rose.
  - *Gold accent:* reserved for celebratory CTAs (e.g. "Create your registry") — gold-light→rose gradient.
  - *Ghost / text:* `ink` text, no fill.
- **Funding progress bar** *(signature)* — pill track in `soft`, fill in gold→rose gradient, label "₦680k of ₦1m" in `ink` tabular numerals. Appears on every gift and goal.
- **Gift card** — white surface, `radius-lg`, `shadow-md`, image/emoji top, title (h3), giver/goal sub (muted), progress bar, action button.
- **Cards** — white, `radius-md`, `line` border or `shadow-sm`; optional left accent bar (`rose`, 3px) or top accent bar.
- **Inputs** — white, `radius-sm`, `line` border, `berry` focus ring; labels in `ink`. (Never gold borders.)
- **Chips / badges** — `soft` bg, `rose-deep` or `success` text, pill. e.g. "Fully funded", "Group gift".
- **Icon treatment** — line/solid icons inside a `soft` circle; one consistent style per surface (don't mix outline + filled in the same group).
- **Dividers** — 1px `line`, or a 1px gold hairline for decorative/emotional moments only.

---

## 6. Accessibility rules (non-negotiable)

- Body/functional text uses `ink` or `muted` — **target ≥ 4.5:1**.
- `gold` only for accents and large/decorative elements; if gold ever carries meaning, pair it with an icon or label.
- All interactive elements: visible focus ring (`berry`, 2px), min 44×44px tap target.
- Never encode state in color alone (e.g. "funded" = green **and** a check + label).
- Test the gold/berry pairings before shipping any new surface.

---

## 7. Tailwind token mapping

```js
// tailwind.config.js → theme.extend
colors: {
  berry: { DEFAULT: '#6D2E46', deep: '#521F33' },
  rose:  { DEFAULT: '#C8688A', deep: '#A84D70' },
  gold:  { DEFAULT: '#B98A2E', light: '#D9A86C', champagne: '#EBCFA8' },
  ink: '#2A222F', muted: '#6F6470', line: '#E7DBD3',
  soft: '#F3E7DF', cream: '#FBF6F1',
  success: '#2E7D5B', warning: '#B98A2E', error: '#B23A48', info: '#50808E',
},
fontFamily: {
  display: ['"Playfair Display"', 'Georgia', 'serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
borderRadius: { sm: '8px', md: '14px', lg: '18px', pill: '999px' },
boxShadow: {
  sm: '0 4px 14px rgba(109,46,70,.07)',
  md: '0 8px 28px rgba(109,46,70,.10)',
  lg: '0 18px 50px rgba(109,46,70,.14)',
},
```

shadcn/ui: map its CSS variables (`--primary`, `--secondary`, `--accent`, `--background`,
`--foreground`, `--ring`) onto these tokens so every shadcn component inherits the brand
automatically — then restyle the handful of surfaces (buttons, cards, progress) that carry
the wedding feel.

---

*Agamos design system v1 — romantic blush + gold, built to be felt and trusted.*
