# Loop Design System v3.0 (Warm Sunrise 2026)

**Inspired by:** Warm Sunrise + iOS 26 Liquid Glass + playful Gen Z simplicity
**Target:** Gen Z (ages 16-24)
**Vibe:** Warm, friendly, premium polish with soft glass layers
**Updated:** 2026-02-03

---

## What Changed in v3.0

- Expanded surface tokens for liquid glass and layered materials
- Refined neutral/text ramps for better readability and accessibility
- New gradient palette for onboarding and hero moments
- Dark mode parity for all key tokens
- Motion specs for page transitions and micro‑interactions

---

## Implementation Status

| Area | Status | Source of Truth |
|------|--------|-----------------|
| Tokens | ✅ | `lib/theme.ts` |
| Typography | ✅ | `lib/theme.ts` |
| Gradients | ✅ | `lib/theme.ts` |
| Glass Surfaces | ✅ | `components/ui/GlassCard.tsx` |
| Motion Guidelines | ✅ | `lib/theme.ts` |
| Widgets | ✅ | `targets/widget/Widget.swift` + `lib/widgetSync.ts` |
| Design System Guide | ✅ | `DESIGN_SYSTEM.md` |

---

## Design Philosophy

1. **Warmth** – coral and sunrise gradients create emotional connection
2. **Clarity** – content first; UI supports without noise
3. **Delight** – gentle motion + haptics on key moments
4. **Native** – iOS 26 materials and behaviors
5. **Consistency** – app, onboarding, and widgets share the same system

---

## Color Palette (Warm Sunrise 2026)

```ts
export const colors = {
  primary: { DEFAULT: '#FF6B6B', light: '#FF8E8E', dark: '#E85555' },
  success: { DEFAULT: '#97DC38', light: '#B5E868', dark: '#7BC22A' },
  accent:  { DEFAULT: '#A1A8EA', light: '#BFC4F2', dark: '#8289D8' },
  warning: '#FFB347',
  error:   '#FF6B6B',
  info:    '#A1A8EA',

  background: {
    DEFAULT: '#FFFBF7',
    secondary: '#FFF5EE',
    tertiary: '#FFEEE5',
    pure: '#FFFFFF',
  },

  text: {
    DEFAULT: '#1A1A2E',
    secondary: '#3E3E59',
    tertiary: '#6D6D8A',
    muted: '#9C9CB4',
    faint: '#C9C9D8',
    inverse: '#FFFFFF',
  },

  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    card: '#FFFFFF',
    sunlit: '#FFF8F3',
    overlay: 'rgba(255,255,255,0.96)',
    glass: 'rgba(255,255,255,0.72)',
    glassStrong: 'rgba(255,255,255,0.86)',
    glassTint: 'rgba(255,233,220,0.38)',
  },
}
```

---

## Gradient Palette

```ts
export const gradients = {
  sunrise: ['#FFFBF7', '#FFE4D6', '#FFD4C4'],
  celebration: ['#E8FFB8', '#C5F06A', '#97DC38'],
  onboarding: ['#FFF5EE', '#FFE4D6', '#FFD4C4'],
  coral: ['#FF6B6B', '#FF8E8E', '#FFB4B4'],
  lavender: ['#A1A8EA', '#BFC4F2', '#E0E4FF'],
  lime: ['#B5E868', '#97DC38', '#C5F06A'],
  hero: ['#FFF8F3', '#FFEDE3', '#F7E7DE'],
  glass: ['rgba(255,255,255,0.9)', 'rgba(255,244,238,0.85)', 'rgba(255,255,255,0.95)'],
}
```

---

## Typography (SF Pro)

- **Display:** SF Pro Display for large headers
- **Body:** SF Pro Text for all body copy
- **Weights:** 400, 500, 600, 700
- **Default Body Size:** 17

---

## Surfaces & Materials

### 1) Solid Surfaces
- Use `surface.card` for most content cards
- Use `surface.sunlit` for warm, elevated sections

### 2) Glass Surfaces (Liquid Glass)
- Use `GlassCard` for premium sections (max 3‑4 per screen)
- Use `surface.glassStrong` for higher contrast
- Use `surface.glass` for airy overlays

---

## Buttons

- **Primary:** coral gradient or solid `primary.DEFAULT`
- **Secondary:** outline + `surface.card`
- **Pressed state:** darken by 10–12% and reduce scale to 0.98

---

## Inputs

- Use a single baseline style across the app
- Inline validation messages should use `text.tertiary` for guidance and `error` for errors

---

## Motion Guidance

- **Micro‑interactions:** 120–200ms
- **Screen transitions:** 280–520ms
- Always respect reduced motion

---

## Widget Design Alignment

Widgets must:
- Use the same color tokens and typography as the app
- Respect the active widget theme (global)
- Use consistent spacing and rounded corners
- Match widget previews shown in onboarding and settings

---

## Usage

- All screens should source colors and gradients from `lib/theme.ts`
- Avoid hard‑coded colors in screens unless explicitly noted
