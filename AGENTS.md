<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions & Agent Guidelines

## 1. MANDATORY: Design System Adherence (`DESIGN.md`)

**CRITICAL REQUIREMENT:**
Every frontend page, view, component, modal, sheet, form, card, badge, button, or styling modification in this project **MUST strictly follow the design system defined in `DESIGN.md`**.

Before creating, editing, or refactoring any UI code:
1. **Read `DESIGN.md`** located at the root of the workspace.
2. Verify that all colors, typography, spacing, border radii, shadows, and interactive states match the specifications in `DESIGN.md`.
3. Do **NOT** introduce arbitrary Tailwind colors (e.g., generic `bg-blue-500`, `bg-purple-600`, or purple-to-blue AI gradients), ad-hoc pixel values, or unapproved font stacks.

### Core Design Tokens Summary (from `DESIGN.md`)

- **Palette**:
  - Chromatic Accents:
    - `--color-primary`: `#B78AF2` (Primary actions, links, active controls, selected states)
    - `--color-coral`: `#FF705B` (Warm emphasis, urgent highlights, alert badges)
    - `--color-mint`: `#A8DCCB` (Success, completed progress, calm surface accents)
    - `--color-sky`: `#BFEAF7` (Informational surfaces, secondary feature cards, timeline cues)
  - Neutrals:
    - `--color-ink`: `#171923` (Main text, strong icons, dark primary buttons)
    - `--color-text-muted`: `#777783` (Secondary text, subtitles, field labels, metadata)
    - `--color-border`: `#D8D7DE` (Borders, dividers, field outlines)
    - `--color-surface`: `#FFFFFF` (Cards, panels, popovers, input backgrounds)
    - `--color-canvas`: `#F4F3F5` (Page & app background)
    - `--color-overlay`: `#171923` (Modals scrims & overlays with opacity)
  - **No AI Slop / Generic Gradients**: Never use generic neon gradients (e.g. `from-purple-500 to-indigo-500`). Use soft pastel backgrounds with high-contrast ink text.

- **Typography**:
  - UI Font (`--font-ui`): `"Lato", ui-sans-serif, system-ui, sans-serif` for 99% of UI (navigation, body, buttons, cards, forms, metrics).
  - Display Font (`--font-display`): `"Grand Hotel", cursive, Georgia, serif` strictly reserved for rare expressive hero headlines, logos, or editorial brand moments. (Avoid browser faux-bold on Grand Hotel; display at natural normal weight).
  - Scale:
    - `--text-xs`: 11px / 16px (weight 500) — tiny metadata, timestamps, chart labels
    - `--text-sm`: 13px / 19px (weight 400–500) — supporting copy, field hints
    - `--text-md`: 15px / 22px (weight 400–500) — default body and controls
    - `--text-lg`: 18px / 26px (weight 600) — card titles, section headings
    - `--text-xl`: 22px / 29px (weight 600–700) — screen titles
    - `--text-2xl`: 28px / 34px (weight 650–700) — page headlines
    - `--text-3xl`: 36px / 42px (weight 700) — hero headline or key metric
  - Use sentence case, short labels, and clear hierarchy over all-caps.

- **Spacing Scale (4px-based)**:
  - `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-8` (32px), `--space-10` (40px), `--space-12` (48px), `--space-16` (64px).
  - Screen gutters: 20–24px (mobile), 32–48px (desktop). Between cards: 12–16px. Between major sections: 24–32px.

- **Border Radius**:
  - `--radius-sm` (8px): small tags, compact badges.
  - `--radius-md` (12px): inputs, buttons, small cards.
  - `--radius-lg` (18px): standard cards, grouped panels.
  - `--radius-xl` (24px): feature cards, prominent surfaces, modals.
  - `--radius-pill` (999px): chips, filter pills, pill buttons.

- **Elevation & Shadows**:
  - `--shadow-card`: `0 4px 18px rgb(23 25 35 / 7%)`
  - `--shadow-popover`: `0 10px 32px rgb(23 25 35 / 12%)`
  - Reserve shadows for surfaces needing lift. Outlined cards on canvas should prefer clean borders (`1px solid var(--color-border)`).

- **Component Patterns (Section 5 of `DESIGN.md`)**:
  - **Buttons**:
    - Primary: dark `--color-ink` (`#171923`) with white text (or `--color-primary` with dark ink text). Height 44–48px, horizontal padding 18–22px, radius `--radius-md` or `--radius-pill`, font weight 600.
    - Secondary: white surface, 1px `--color-border`, `--color-ink` text.
    - Tertiary: transparent background, no border, `--color-ink` or `--color-primary` text with generous hit area.
  - **Inputs & Fields**:
    - Height 44–48px, background `--color-surface`, border 1px solid `--color-border`, radius `--radius-md`, text 15px `--color-ink`, placeholder `--color-text-muted`. Focus ring: 2px `--color-primary` with offset.
  - **Cards**:
    - Background `--color-surface` default, radius `--radius-lg` (18px) or `--radius-xl` (24px), padding 16–24px. Pastel fills (`--color-mint`, `--color-sky`, `--color-coral`, `--color-primary`) reserved for category highlights, status summaries, or space differentiation.
  - **Chips & Badges**:
    - Pill shape (`--radius-pill`), 11–13px type, horizontal padding 8–10px, pastel background + dark ink text.

- **Design Principles**:
  1. Soft, not washed out (pastel surfaces + crisp dark ink).
  2. Friendly geometry (rounded corners, pills, gentle aesthetic).
  3. Whitespace is a feature (breathing room, clear grouping).
  4. One strong action (obvious primary, quiet secondary).
  5. Color with purpose (accent colors communicate hierarchy/meaning, not decoration alone).
  6. Accessible by default (contrast, visible focus, semantic controls).

- **Verification**:
  - Before declaring any frontend task complete, inspect the UI to verify it adheres to `DESIGN.md`.
  - Check with the Impeccable detector or UI linter to avoid anti-patterns or artificial gradient slop.

