// Theme tokens for the public event page. Each theme changes the hero, accents,
// CTA + glow, progress fills, AND the page background, card fill and corner radius
// so every event type gets its own cohesive look.

export interface ThemeTokens {
  label: string
  heroA: string; heroB: string      // hero gradient
  accent: string                    // eyebrows, dates, "raised", links
  ctaA: string; ctaB: string        // CTA + gift buttons + gift placeholder
  ctaShadow: string; ctaGlow: string // rgb triplets for the CTA glow
  barA: string; barB: string        // progress fill
  heroEyebrow: string               // small text on the hero
  pageBg: string                    // page background
  cardBg: string                    // card fill
  cardRadius: string                // card corner radius
  cardBorder?: string               // optional card border
}

export const THEMES: Record<string, ThemeTokens> = {
  blush: {
    label: 'Blush & Gold',
    heroA: '#6D2E46', heroB: '#A84D70', accent: '#A84D70',
    ctaA: '#D9A86C', ctaB: '#C8688A', ctaShadow: '185,138,46', ctaGlow: '235,207,168',
    barA: '#D9A86C', barB: '#C8688A', heroEyebrow: '#EBCFA8',
    pageBg: '#FBF6F1', cardBg: '#FFFFFF', cardRadius: '1rem',
  },
  eternal: {
    label: 'Eternal',
    heroA: '#4A1F2B', heroB: '#7A2E45', accent: '#9B2D43',
    ctaA: '#C9A24B', ctaB: '#8C2F3D', ctaShadow: '160,120,40', ctaGlow: '230,201,140',
    barA: '#C9A24B', barB: '#7A2E45', heroEyebrow: '#E6C98C',
    pageBg: '#FBF4EF', cardBg: '#FFFFFF', cardRadius: '0.625rem',
    cardBorder: '#EDE0D2',
  },
  nursery: {
    label: 'Nursery',
    heroA: '#5E86B8', heroB: '#A878A8', accent: '#5E8AA8',
    ctaA: '#9FC6A0', ctaB: '#E3A7C0', ctaShadow: '95,138,168', ctaGlow: '190,220,210',
    barA: '#A7D3C4', barB: '#E3A7C0', heroEyebrow: '#FDEEF4',
    pageBg: '#F6FAFB', cardBg: '#FFFFFF', cardRadius: '1.5rem',
  },
  confetti: {
    label: 'Confetti',
    heroA: '#E0566A', heroB: '#F2A65A', accent: '#D63E5A',
    ctaA: '#F2C14E', ctaB: '#E0566A', ctaShadow: '215,90,80', ctaGlow: '255,210,150',
    barA: '#F2C14E', barB: '#E0566A', heroEyebrow: '#FFE3C2',
    pageBg: '#FFF8F2', cardBg: '#FFFFFF', cardRadius: '1.25rem',
  },
  memorial: {
    label: 'Memorial',
    heroA: '#3A4750', heroB: '#5A6670', accent: '#50606B',
    ctaA: '#8A949B', ctaB: '#50606B', ctaShadow: '90,102,112', ctaGlow: '190,200,206',
    barA: '#9AA4AB', barB: '#50606B', heroEyebrow: '#D8DEE2',
    pageBg: '#F6F5F2', cardBg: '#FFFFFF', cardRadius: '0.5rem',
    cardBorder: '#E4E2DC',
  },
  // extra optional palettes
  midnight: {
    label: 'Midnight',
    heroA: '#1E2761', heroB: '#3B4490', accent: '#3B4490',
    ctaA: '#CADCFC', ctaB: '#7C8AD6', ctaShadow: '60,72,144', ctaGlow: '202,220,252',
    barA: '#7C8AD6', barB: '#1E2761', heroEyebrow: '#CADCFC',
    pageBg: '#F5F6FB', cardBg: '#FFFFFF', cardRadius: '1rem',
  },
  sage: {
    label: 'Sage',
    heroA: '#2C5F2D', heroB: '#5E8C5F', accent: '#50808E',
    ctaA: '#97BC62', ctaB: '#69A297', ctaShadow: '80,128,142', ctaGlow: '151,188,98',
    barA: '#97BC62', barB: '#50808E', heroEyebrow: '#DDEAD0',
    pageBg: '#F4F8F2', cardBg: '#FFFFFF', cardRadius: '1rem',
  },
}

export const THEME_LIST = Object.entries(THEMES).map(([key, t]) => ({ key, label: t.label }))

export function getTheme(key?: string): ThemeTokens {
  return (key && THEMES[key]) || THEMES.blush
}
