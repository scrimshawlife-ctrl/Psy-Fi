# Frontend Boundary Decision

Status: updated 2026-07-25  
Related: [`PLANS.md`](../PLANS.md), [`docs/WEB_ARCHITECTURE.md`](WEB_ARCHITECTURE.md), [`docs/rendering/`](rendering/)

## Decision

**Two coexisting surfaces:**

1. **Legacy product shell (default `/`)** — progressively enhanced `psyfi_api` static shell (`templates/index.html`, `static/app.js`, Canvas/WebGL Live Experience). Remains the compatibility / PWA path.
2. **GPU platform (optional `/gpu/`)** — Vite + React + TypeScript package `packages/psyfi-gpu-renderer` (React Three Fiber + Three.js `WebGPURenderer`). Served by FastAPI when `dist/` is built. **Does not patch** `static/viz/*`.

Both consume the same authoritative `/api/v1` contracts. The GPU client’s sole render input is immutable `psyfi.scene_snapshot.v1` from `POST /api/v1/visualize/scene-snapshot`.

## Criteria Applied

| Criterion | Existing constraint | Implication |
|---|---|---|
| Deployment model | FastAPI serves UI + API together | Mount GPU `dist/` at `/gpu/`; no separate host required |
| Contributor skill / repo shape | Python-first + growing TS package | Workspace under `packages/`; Python stays simulation authority |
| Bundle/runtime cost | Legacy remains zero-build | GPU build is opt-in (`npm run gpu:build`) |
| API coupling | Soft-frozen `/api/v1` | Additive `scene-snapshot` route; shared ParameterField |
| Accessibility | Neutral View / reduce-motion | Snapshot flags + mandatory safety pass in GPU graph |
| Migration | See [`rendering/MIGRATION_PLAN.md`](rendering/MIGRATION_PLAN.md) | Coexist → feature flag → cutover |

## What Stays Authoritative

- Simulation truth: `psyfi_core` + FastAPI responses
- Design tokens: existing `--pf-*` CSS / `docs/DESIGN_SYSTEM.md` (GPU shell mirrors neutrals)
- Icons: `docs/icons` served at `/assets/icons`
- Contracts: Pydantic models, OpenAPI, freeze pack under `docs/contracts/frozen/`

## Deferred / out of scope for GPU G0

- Hard cutover of `/` to the GPU shell
- Full Ultra post stack (SSAO/SSR/TAA/…) production passes — scaffolded in render graph + WGSL stubs
- Native iOS (`docs/IOS_MIGRATION.md`)
