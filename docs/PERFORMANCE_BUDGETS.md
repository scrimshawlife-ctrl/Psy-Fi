# Performance Budgets

Status: Phase 2 targets for the existing FastAPI web shell  
Related: [`docs/BASELINES.md`](BASELINES.md), [`PLANS.md`](../PLANS.md)

## Device Classes

| Class | Example | Notes |
|---|---|---|
| Desktop | Chromium laptop | Primary developer target |
| Mobile mid | Current Android Chrome | Worker rasterize + Canvas 2D expected |
| Mobile Safari | Current iPhone Safari | WebGPU may be unavailable; fallback required |

## Budgets

| Metric | Budget | Enforcement |
|---|---|---|
| Shell interactive | ≤ 3.0 s mid-tier mobile | Manual / Lighthouse smoke |
| Standard simulate 64×64×20 | ≤ 2.0 s local server | Pytest timing optional later |
| Deep simulate 256×256×100 | ≤ 15.0 s local server | UI must remain cancellable via AbortController |
| Heatmap rasterize 64×64 | ≤ 16 ms worker time preferred | Worker path; main-thread fallback OK |
| Visualization present | ≤ 50 ms after JSON parse on desktop | Canvas2D or WebGPU |
| Memory across 20 standard runs | No unbounded growth | Manual heap snapshots |
| SW precache | Shell assets only (no `/simulate` bodies) | `sw.js` review |

## Renderer Policy

1. Rasterize in a **Web Worker** when available (legacy heatmap).
2. Legacy Live Experience: Prefer WebGL ParameterField by default; Canvas 2D fallback. LOD from `quality_tier` (+ adaptive drop).
3. GPU platform (`/gpu/`): WebGPU-first via `packages/psyfi-gpu-renderer` with tier budgets in [`docs/rendering/GPU_PERFORMANCE_BUDGET.md`](rendering/GPU_PERFORMANCE_BUDGET.md).
4. Fall back to **Canvas 2D** / legacy shell without blocking metrics/provenance.
5. Never require WebGPU for core workspace simulation workflow completion.

## Cancellation

- Browser `AbortController` cancels the in-flight `fetch`.
- Esc or Cancel stops applying results in the UI.
- Server-side compute may still complete after abort; this is acceptable until async job cancellation exists.
