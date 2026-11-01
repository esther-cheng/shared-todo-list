# Gemini Agent Directives

Please see [AGENTS.md](./AGENTS.md) for full project rules and instructions.

## Critical Design Mandate
All frontend development in this workspace must strictly adhere to the design system in [DESIGN.md](./DESIGN.md).

- **Colors**: Use the tokens in `DESIGN.md` (`--color-primary`, `--color-coral`, `--color-mint`, `--color-sky`, `--color-ink`, `--color-text-muted`, `--color-border`, `--color-surface`, `--color-canvas`).
- **Typography**: `Lato` for UI, `Grand Hotel` for display headlines/brand moments (avoid faux-bolding).
- **Spacing & Radius**: Modular 4px scale, defined border radii (`--radius-sm` to `--radius-pill`).
- **Anti-patterns**: No unapproved neon AI gradients, no untokenized colors, maintain WCAG AA contrast.
- **Skill**: Refer to the `.agents/skills/design-system` skill for component guidelines.
