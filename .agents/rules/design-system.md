# Design System Enforcement Rule

This rule is active across the entire workspace. Whenever working on UI components, layouts, pages, styles, or visual elements, the agent must comply with `DESIGN.md`.

## Mandatory Directives

1. **Source of Truth**: `DESIGN.md` in the project root is the visual contract. Never invent alternative color schemes, typography, spacing scales, or radii.
2. **Color Palette**:
   - Primary: `#B78AF2` (`--color-primary`)
   - Coral: `#FF705B` (`--color-coral`)
   - Mint: `#A8DCCB` (`--color-mint`)
   - Sky: `#BFEAF7` (`--color-sky`)
   - Ink: `#171923` (`--color-ink`)
   - Text Muted: `#777783` (`--color-text-muted`)
   - Border: `#D8D7DE` (`--color-border`)
   - Surface: `#FFFFFF` (`--color-surface`)
   - Canvas: `#F4F3F5` (`--color-canvas`)
   - Overlay: `#171923` (`--color-overlay`)
   - **Banned**: AI cliché neon gradients (such as `from-purple-500 to-indigo-500` or cyan-on-dark), saturated full-screen backgrounds, or arbitrary untokenized Tailwind hexes.
3. **Typography**:
   - Interface text: `Lato` (`--font-ui`).
   - Editorial & brand headings: `Grand Hotel` (`--font-display`), used for expressive brand moments and logo (keep weight normal).
   - Type scale: follow `--text-xs` (11px) through `--text-3xl` (36px).
4. **Spacing & Radii**:
   - 4px modular spacing scale (`--space-1` to `--space-16`).
   - Border radii: `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (18px), `--radius-xl` (24px), `--radius-pill` (999px).
5. **Component Styling**:
   - Buttons, Inputs, Cards, and Badges must follow Section 5 of `DESIGN.md`.
   - Primary actions must be unmistakable; secondary actions subtle; hit targets minimum 44px on interactive controls.
