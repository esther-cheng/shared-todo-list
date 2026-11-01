# Design System

A warm, friendly UI system distilled from the four visual references: rounded geometry, generous whitespace, soft color fields, restrained dark ink, and approachable editorial typography. Use the tokens as defaults; keep bright colors for accents and meaningful states rather than coloring every surface.

## 1. Color tokens

Use **four chromatic tokens** plus neutrals. The references vary between calming pastels and a vivid coral/yellow treatment, so the palette below keeps the softer look as the default and reserves the saturated color for emphasis.

| Token | Hex | Intended use |
|---|---|---|
| `--color-primary` | `#B78AF2` | Primary actions, links, selected controls, small highlights |
| `--color-coral` | `#FF705B` | Warm emphasis, badges, illustration accents, high-priority highlights |
| `--color-mint` | `#A8DCCB` | Success, positive progress, calm feature surfaces |
| `--color-sky` | `#BFEAF7` | Informational surfaces, secondary feature cards, progress indicators |

### Neutrals

| Token | Hex | Intended use |
|---|---|---|
| `--color-ink` | `#171923` | Main text, strong icons, dark primary buttons |
| `--color-text-muted` | `#777783` | Supporting text, labels, metadata |
| `--color-border` | `#D8D7DE` | Input borders, dividers, subtle outlines |
| `--color-surface` | `#FFFFFF` | Cards, fields, sheets |
| `--color-canvas` | `#F4F3F5` | App/page background |
| `--color-overlay` | `#171923` | Scrims and overlays; use with opacity |

**Color guidance**
- Keep page backgrounds neutral and let a few pastel surfaces do the work.
- Use dark ink for readable text; avoid placing small text directly on saturated coral or purple.
- Pair each semantic color with a neutral text color and check contrast in the actual UI.
- For dark mode, use a deep ink canvas and slightly lifted surfaces; do not simply invert every token.

## 2. Typography

Use two fonts: **Lato** for interface text and **Grand Hotel** for occasional expressive headings, brand moments, or editorial titles. If unavailable, fall back to a clean system sans-serif and a cursive/serif font respectively.

```css
:root {
  --font-ui: "Lato", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: "Grand Hotel", cursive, Georgia, serif;
}
```

### Type scale

| Token | Size | Line height | Weight | Use |
|---|---:|---:|---:|---|
| `--text-xs` | 11px | 16px | 400–500 | Tiny metadata, timestamps, chart labels |
| `--text-sm` | 13px | 19px | 400–500 | Supporting copy, field hints |
| `--text-md` | 15px | 22px | 400–500 | Default body and controls |
| `--text-lg` | 18px | 26px | 600–700 | Card titles, section headings |
| `--text-xl` | 22px | 29px | 600–700 | Screen titles |
| `--text-2xl` | 28px | 34px | 400 (display) / 700 | Page headline / onboarding heading |
| `--text-3xl` | 36px | 42px | 400 (display) / 700 | Hero headline or key metric |

**Typography rules**
- Use `--font-ui` (`Lato`) for almost all UI: navigation, body copy, buttons, inputs, metrics, and labels.
- Use `--font-display` (`Grand Hotel`) for brand moments, logos, or warm welcoming headings; avoid it for dense product interfaces or small body text.
- Note on Grand Hotel: As an expressive script font (weight 400), avoid synthetic browser bolding on Grand Hotel; prefer natural sizing and normal weight for crisp, elegant rendering.
- Prefer sentence case, short labels, and clear hierarchy over all-caps.
- Use medium/bold weights in Lato for clear contrast without clutter.
- For small labels, increase letter spacing slightly (`0.04em`) and use muted ink.

## 3. Spacing scale

Use a consistent 4px-based scale. Prefer larger gaps between groups and compact spacing within a control.

| Token | Value |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

**Spacing guidance**
- Screen/page gutters: 20–24px on mobile; 32–48px on larger screens.
- Between related controls: 8–12px.
- Between cards: 12–16px.
- Between major sections: 24–32px.
- Give content room to breathe; avoid packing every available space.

## 4. Border radius and elevation

| Token | Value | Use |
|---|---:|---|
| `--radius-sm` | 8px | Small tags, compact controls |
| `--radius-md` | 12px | Inputs, buttons, small cards |
| `--radius-lg` | 18px | Standard cards and grouped panels |
| `--radius-xl` | 24px | Feature cards, prominent surfaces |
| `--radius-pill` | 999px | Chips, badges, pill buttons |
| `--radius-phone` | 32px | Full-screen mobile mockups only |

Use soft, low-contrast shadows rather than heavy elevation:

```css
:root {
  --shadow-card: 0 4px 18px rgb(23 25 35 / 7%);
  --shadow-popover: 0 10px 32px rgb(23 25 35 / 12%);
}
```

Reserve shadows for surfaces that need separation. Outlined cards on a neutral canvas can use no shadow.

## 5. Component styling

### Buttons

**Primary**
- Background: `--color-ink` for a strong, dependable action; use `--color-primary` for a more playful branded action.
- Text: white on ink; dark ink on light purple after checking contrast.
- Height: 44–48px.
- Horizontal padding: 18–22px.
- Radius: `--radius-md` or `--radius-pill` for a softer, more casual action.
- Font: UI, 14–15px, weight 600.
- Hover: slightly darken the background or raise brightness subtly; avoid dramatic gradients.
- Focus: visible 2px focus ring with offset.

**Secondary**
- White or transparent background, 1px `--color-border` border, dark ink text.
- Match the primary button's height and radius.
- Hover: neutral canvas background.

**Tertiary / text**
- Transparent background, no border, ink or primary-colored text.
- Use for low-emphasis actions; provide a generous hit area.

**Disabled**
- Use a muted neutral surface and muted text. Do not rely on opacity alone to communicate state.

### Inputs

- Height: 44–48px for single-line inputs; text areas should have at least 96px of height when appropriate.
- Background: `--color-surface`.
- Border: 1px solid `--color-border`.
- Radius: `--radius-md`.
- Padding: 12–14px horizontal, 10–12px vertical.
- Text: 15px UI font in `--color-ink`; placeholder in `--color-text-muted`.
- Label: 13–14px, medium weight, placed above the field with 6–8px spacing.
- Focus: 2px `--color-primary` ring with a small offset; preserve a clear boundary.
- Error: use coral plus an explicit text message and accessible error association. Do not rely on color alone.

### Cards

- Background: `--color-surface` by default.
- Radius: `--radius-lg` (18px); use `--radius-xl` for large feature cards.
- Padding: 16–24px depending on density.
- Border: optional 1px subtle border on busy or gray backgrounds.
- Shadow: optional `--shadow-card`; keep it soft.
- Use pastel fills (`--color-mint`, `--color-sky`, `--color-coral`, or `--color-primary`) for a small number of featured cards, status summaries, or category tiles.
- Keep text and icons aligned consistently; use a strong title, concise supporting copy, and optional metadata.
- Avoid using a different accent color for every card unless color encodes a meaningful category.

### Chips, badges, and status

- Prefer pill shapes with `--radius-pill`.
- Use 11–13px type and compact horizontal padding (8–10px).
- Keep badges short; use a small icon only when it improves recognition.
- Pastel background + dark text is the default treatment.

### Navigation

- Use simple, quiet icons with short labels.
- Active item: dark ink or primary accent; inactive items: muted text.
- Mobile navigation should have comfortable tap targets (at least 44px tall).

## 6. Responsive layout principles

- Use a neutral canvas, a clear content column, and consistent gutters.
- Mobile: one-column layout, 20–24px side padding, 12–16px card gaps.
- Tablet/desktop: expand whitespace and use a grid rather than stretching cards across the full viewport.
- Keep text line lengths comfortable (roughly 45–75 characters for long-form content).
- Use responsive type and spacing only where needed; preserve the underlying scale.

## 7. CSS token starter

```css
:root {
  /* Color */
  --color-primary: #B78AF2;
  --color-coral: #FF705B;
  --color-mint: #A8DCCB;
  --color-sky: #BFEAF7;

  --color-ink: #171923;
  --color-text-muted: #777783;
  --color-border: #D8D7DE;
  --color-surface: #FFFFFF;
  --color-canvas: #F4F3F5;

  /* Typography */
  --font-ui: "Lato", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: "Grand Hotel", cursive, Georgia, serif;

  /* Type scale */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: 36px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Elevation */
  --shadow-card: 0 4px 18px rgb(23 25 35 / 7%);
  --shadow-popover: 0 10px 32px rgb(23 25 35 / 12%);
}
```

## 8. Design principles

1. **Soft, not washed out:** pastel surfaces paired with crisp dark text.
2. **Friendly geometry:** rounded corners, pills, and gentle illustrations without making every element bubbly.
3. **Whitespace is a feature:** prioritize breathing room and clear grouping.
4. **One strong action:** make the primary action obvious; keep secondary controls quiet.
5. **Color with purpose:** accent colors communicate hierarchy or meaning, not decoration alone.
6. **Accessible by default:** visible focus, sufficient contrast, semantic controls, and non-color state indicators.
