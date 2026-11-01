---
name: design-system
description: >-
  Use whenever creating, modifying, styling, refactoring, or reviewing any frontend page, component,
  modal, form, or visual element in this application. Enforces strict compliance with the DESIGN.md
  design system, including color tokens, typography scales, 4px spacing, border radii, component
  patterns, and anti-pattern prevention.
---

# Design System Implementation Skill

This skill enforces continuous compliance with `DESIGN.md` across all frontend code in this repository.

## When to Run

- Creating new pages or views (e.g. in `src/app/`)
- Creating or editing React components (e.g. in `src/components/`)
- Adjusting styles, CSS variables, or Tailwind utilities (e.g. in `src/app/globals.css`)
- Reviewing or auditing existing UI surfaces for visual consistency

---

## 1. Reference Check

Always read `DESIGN.md` before initiating any frontend changes. Confirm:
1. **Intended Mode & Surface**: Is this an *Operate* surface (app task board, modal, settings) or an *Experience/Persuade* surface? (Tandem is primarily *Operate* with warm, casual brand character).
2. **Color Palette Mapping**:
   - Primary action / selection: `--color-primary` (`#B78AF2`)
   - Urgency / alerts / highlight badges: `--color-coral` (`#FF705B`)
   - Success / positive progress: `--color-mint` (`#A8DCCB`)
   - Info / timelines / cards: `--color-sky` (`#BFEAF7`)
   - Text / primary buttons: `--color-ink` (`#171923`)
   - Secondary text / hints: `--color-text-muted` (`#777783`)
   - Outlines / dividers: `--color-border` (`#D8D7DE`)
   - Card / modal surface: `--color-surface` (`#FFFFFF`)
   - App background: `--color-canvas` (`#F4F3F5`)
3. **Typography**:
   - Base UI: `Lato` (`--font-ui`)
   - Expressive / Brand Hero: `Grand Hotel` (`--font-display`)
   - Never use arbitrary fonts or unscaled heading sizes. Use Grand Hotel at natural normal weight.
4. **Spacing & Radius**:
   - Spacing: `--space-1` (4px) to `--space-16` (64px)
   - Radius: `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (18px), `--radius-xl` (24px), `--radius-pill` (999px)

---

## 2. Component Implementation Standards

### Buttons
- **Primary**: Solid `--color-ink` with white text, or `--color-primary` with dark ink text. Height 44–48px. Radius `--radius-md` (12px) or `--radius-pill`. Weight 600.
- **Secondary**: White or transparent ground, 1px `--color-border` outline, `--color-ink` text.
- **Tertiary**: Transparent, no border, `--color-ink` or `--color-primary` text with minimum 44px hit target.

### Inputs & Selects
- Height 44–48px.
- Background: `--color-surface` (`#FFFFFF`).
- Border: 1px solid `--color-border` (`#D8D7DE`).
- Radius: `--radius-md` (12px).
- Focus: 2px `--color-primary` focus ring with offset.
- Error states: pair `--color-coral` with explicit helper text.

### Cards & Panels
- Background: `--color-surface` (`#FFFFFF`).
- Radius: `--radius-lg` (18px) for standard cards; `--radius-xl` (24px) for modals and hero cards.
- Padding: 16–24px.
- Border/Shadow: subtle 1px border or `--shadow-card` (`0 4px 18px rgb(23 25 35 / 7%)`).

### Chips & Badges
- Shape: `--radius-pill` (999px).
- Font: 11–13px, weight 500.
- Treatment: soft pastel background (`--color-mint`, `--color-sky`, `--color-coral`, or `--color-primary`) with dark ink text.

---

## 3. Strict Anti-Pattern Checklist

- [ ] **NO generic neon AI gradients**: Do not use `bg-gradient-to-r from-purple-500 to-indigo-500` or cyan accents on dark backgrounds.
- [ ] **NO untokenized colors**: Do not hardcode arbitrary hexes or standard Tailwind saturated palettes (e.g. `bg-blue-600`) unless mapped to `DESIGN.md`.
- [ ] **NO tiny click targets**: All clickable controls must meet the 44px touch/click target guideline.
- [ ] **NO low-contrast text**: Always verify that text on pastel badges or buttons uses `--color-ink` (`#171923`) rather than washed-out white or low-contrast light grey.
- [ ] **Run verification**: When UI changes are completed, run the design detector to ensure clean compliance:
  ```bash
  /Users/esthe/.gemini/config/skills/impeccable/scripts/impeccable detect --json src/
  ```
