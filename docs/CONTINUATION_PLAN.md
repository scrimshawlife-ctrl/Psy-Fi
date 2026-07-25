# PsyFi Web Continuation Plan

Status: active (2026-07-25)  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).

## Baseline (merged)

- `/api/v1` workspace + jobs + PWA + Live Experience + substance overlays
- P0–P2 scaffolding (goldens, engine split, dual-canvas WebGL, modulators, export, bridge)
- README hero + CI workflow
- **Soft freeze** of `/api/v1` contracts (`docs/contracts/frozen/`, freeze id `psyfi-api-v1-soft-2026-07-25`)

## Remaining human gates

1. Fill physical-device matrix rows (Safari/Chrome/Edge/Firefox) in `docs/BROWSER_CAPABILITY_MATRIX.md`
2. Complete Phase 4 usability evidence in `docs/PHASE4_USABILITY.md`
3. Promote soft freeze → **hard freeze** once (1)+(2) are done

## Next engineering slices (optional)

1. [x] Feed last-sim visualization texture into Canvas/WebGL as an optional source plane (bridge already reuses last sim metadata)
2. [x] **GPU platform G0** — modular WebGPU/R3F package + `scene-snapshot` API (`docs/rendering/`); G1 present path next
3. Per-engine WebGL shader modules matching Canvas kernels 1:1 (legacy track only; do not block GPU platform)
4. More scraped positive packs for underrepresented substances
5. Structured usability sessions → Phase 4 exit

## Commands

```bash
python3 scripts/build_experience_catalog.py
python3 scripts/regenerate_overlay_goldens.py
python3 scripts/export_openapi.py
python3 scripts/sync_frozen_contracts.py
python3 -m pytest tests/ -q
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
