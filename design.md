# Design — PsyFi

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre
atmospheric

## Macrostructure family
- Marketing pages: Photographic (field-led, one dominant visual)
- App pages: Workbench (instrument panel; field viewport primary, chrome calm)
- Content pages: Long Document

## Theme
Dark instrument lab. One cyan signal. No gradient headlines, no glow soup, no pill nav.

- `--color-paper`     oklch(0.14 0.02 250)
- `--color-paper-2`   oklch(0.18 0.02 250)
- `--color-ink`       oklch(0.96 0.01 250)
- `--color-ink-2`     oklch(0.72 0.03 250)
- `--color-rule`      oklch(0.32 0.02 250)
- `--color-accent`    oklch(0.82 0.12 200)
- `--color-focus`     oklch(0.82 0.12 200)

Live CSS maps these onto existing `--pf-*` / `--color-*` aliases in `psyfi_api/static/style.css`.

## Typography
- Display: Space Grotesk, weight 500–600, style normal
- Body: IBM Plex Sans, weight 400–500
- Mono: IBM Plex Mono, weight 400–500

## Component archetypes
- Nav: N9 edge-aligned minimal (hairline, not pills)
- Footer: Ft2 inline single line
- Buttons: solid accent fill / hairline secondary — no gradient fills
- Cards: single containment layer, hairline border, no outer glow

## Motion
- Interface transitions 120–220 ms
- Respect `prefers-reduced-motion`
- Motion communicates run/cancel/field state only

## Notes — do NOT carry over
- Inter as UI face
- Cyan→magenta gradient headlines or primary buttons
- Multi-layer neon box-shadows on panels/metrics
- Rounded-full pill navigation chips
- Aurora radial body blooms as chrome decoration
- Emoji as control icons
