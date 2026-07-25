# Frontend Boundary Decision

Status: accepted for Phase 0 → Phase 1  
Related: [`PLANS.md`](../PLANS.md), [`docs/WEB_ARCHITECTURE.md`](WEB_ARCHITECTURE.md)

## Decision

**Progressively enhance the existing `psyfi_api` static shell** (`templates/index.html`, `static/app.js`, `static/style.css`, `static/sw.js`) as the Phase 1 product surface.

A dedicated Vite + React + TypeScript application remains the default longer-term path from `docs/WEB_ARCHITECTURE.md`, but is **not** required to clear the Phase 0 exit gate.

## Criteria Applied

| Criterion | Existing constraint | Implication |
|---|---|---|
| Deployment model | FastAPI serves UI + API together (`scripts/run_api.sh`, Render/Azure/Docker) | Keep co-located static assets until a separate host is justified |
| Contributor skill / repo shape | Python-first repo with a small vanilla JS client | Avoid introducing a second toolchain before contracts stabilize |
| Bundle/runtime cost | No frontend build step today | Progressive enhancement preserves zero-build local/dev deploy |
| API coupling | `/simulate/` and MIDI routers already wired | Extend response contracts additively; do not fork clients |
| Accessibility tooling | Manual smoke tests only | Add baselines now; framework a11y tooling can arrive with Vite later |
| Migration complexity | Design tokens and icons already live under `docs/style` and `docs/icons` | Reuse those assets via mounts/aliases instead of new packages |

## What Stays Authoritative

- Simulation truth: `psyfi_core` + FastAPI responses
- Design tokens: existing `--pf-*` CSS, with semantic aliases from `docs/DESIGN_SYSTEM.md`
- Icons: `docs/icons` served at `/assets/icons`
- Contracts: Pydantic models in `psyfi_core/models/session.py` and OpenAPI from FastAPI

## Deferred

- Creating `apps/web` / `packages/*` monorepo layout
- Next.js or SSR
- IndexedDB (localStorage is the interim session store)
- Web Workers / WebGPU renderer
