# Migration Plan — Legacy Viz → GPU Platform

## Principle

**Coexist, then cut over.** Do not patch `psyfi_api/static/viz/*`. Both clients share `/api/v1`.

## Stages

### M0 — Parallel scaffold (current)

- Docs under `docs/rendering/`
- Package `packages/psyfi-gpu-renderer`
- Python `scene_snapshot` + additive API route
- FastAPI mounts `/gpu/` when `dist/` exists
- Legacy shell gains a non-blocking link to GPU lab

### M1 — Feature approach

| Legacy capability | GPU target |
| --- | --- |
| ParameterField engines | Procedural scene + uniforms from snapshot |
| SafetyPass | `post.safety` mandatory |
| Neutral View | Snapshot flag / engine weights |
| WebGL ParameterField path | WebGPURenderer (+ WebGL backend fallback) |
| Sim source plane | Magnitude channel texture in snapshot |
| Export PNG/JSON | Renderer readback + snapshot dump |

### M2 — Soft cutover

- Feature flag `PSYFI_GPU_CLIENT=1` or user toggle “GPU Experience”
- Default remains legacy until budgets + usability evidence land
- Scene-snapshot schema added to freeze pack when stable

### M3 — Hard cutover

- `/` serves GPU shell (or embeds it); legacy moved to `/legacy/`
- SW precache updated for GPU assets
- `static/viz` marked deprecated; removal only after Phase 4 gates + iOS decision

## Rollback

Keep legacy assets and routes. Disable `/gpu/` mount by removing `dist/` or env `PSYFI_SERVE_GPU=0`.

## Contract discipline

- Additive OpenAPI only during soft freeze; run `scripts/export_openapi.py` + `scripts/sync_frozen_contracts.py`
- Renderer must accept frozen `parameter_field` shapes without requiring new inference fields
- No medical claims in GPU UI copy (same as Live Experience)
