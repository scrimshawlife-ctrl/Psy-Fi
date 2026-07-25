# Accessibility and Performance Baselines

Status: Phase 0 initial targets  
Related: [`PLANS.md`](../PLANS.md), [`MOBILE_PWA_GUIDE.md`](../MOBILE_PWA_GUIDE.md), [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)

These are acceptance baselines for the existing FastAPI-served web shell. They are not yet CI-enforced; record measured results when changing UI, SW, or simulation payload size.

## Accessibility Baseline

| Check | Target |
|---|---|
| Text zoom | User scaling enabled (`viewport` must not set `user-scalable=no`) |
| Touch targets | Primary controls ≥ 44×44 CSS px |
| Body text | ≥ 16 CSS px on mobile |
| Keyboard | Configure → Run (Ctrl/Cmd+Enter) → inspect results without pointer |
| Focus | Visible focus on inputs and buttons |
| Contrast | Text/icon contrast against `surface.canvas` / `surface.panel` meets WCAG AA for body copy |
| Reduced motion | Decorative load animation may be skipped later; critical state changes remain textual |
| Screen reader | Form labels present; provenance and network status exposed via text/`aria-live` |
| Semantics | Prefer `simulation`, `model`, `metric`, `estimate`; never present metrics as medical findings |

## Performance Baseline

Device classes to sample: desktop Chromium, current iPhone Safari, mid-range Android Chrome.

| Metric | Initial budget |
|---|---|
| App shell interactive | ≤ 3.0 s on mid-tier mobile over broadband |
| `/simulate/` 64×64 × 20 steps | ≤ 2.0 s server time locally; record p95 in deploy notes |
| `/simulate/` 256×256 × 100 steps | ≤ 15.0 s server time locally; UI must remain cancellable in a later phase |
| Service worker install | Shell assets only; do not precache API responses |
| Repeated runs memory | No unbounded growth across 20 standard runs in one tab |
| Payload | JSON response for standard run remains metrics/session metadata only (no raw field dump yet) |

## Measurement Notes

- Use browser Performance panel / Lighthouse as smoke signals, not sole gates.
- Pair any visualization work with frame-time notes before adopting WebGPU.
- When baselines are violated, document the regression in the PR rather than silently raising the budget.
