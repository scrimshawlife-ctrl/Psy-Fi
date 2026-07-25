# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G0–G4 ship gates met; living QA continues  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | Done + last-sim source plane |
| Phenomenology overlays | 13 overlay substances |
| GPU G0–G3 | Present · compute · TAA · GTAO/SSR/fog/DoF/MB/chroma |
| GPU G4 ship gates | Assets · parity · structure + soft pixel goldens · PWA route |
| Desktop Ultra (multi-vendor) | NVIDIA 30/40/50 · AMD RX 6/7/9xxx · Intel Arc · Apple Pro/Max |
| Ultra QA | **Simulated pass** (`SIMULATED_ULTRA_QA.md`); hardware fps optional |
| CI / Docker GPU dist | Done |
| Device matrix | **Filled** (2026-07-25) — living QA |
| Phase 4 usability | **Filled** (2026-07-25) |

## Device matrix

[`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) has target-device rows from the 2026-07-25 human pass, AMD/Intel peer rows, and a CI **simulated Ultra QA** row. Re-validate after major UI changes; rows are not a freeze gate.

## Engineering queue

### Done — core ship

- P0–P2 continuation + G2 compute/TAA/asset decode
- Hard freeze; production readiness board in README
- G3 premium desktop stack + multi-vendor Ultra auto-tier
- G4 cutover ship gates (parity, goldens, PWA route, SceneAssetLayer)

### Done — multi-vendor Ultra + G4

- [x] High-performance WebGPU adapter (`powerPreference`)
- [x] NVIDIA RTX 30/40/50 · AMD RX 6000/7000/9000 · Intel Arc · Apple Pro/Max → **Ultra**
- [x] HUD adapter / vendor / perf-band + profiling (FPS · avg/p95/max · budget)
- [x] `docs/DESKTOP_GPU.md` · `docs/NVIDIA_GPU.md` · Compose `--profile nvidia`
- [x] Draco/KTX2 GPU upload path + `SceneAssetLayer`
- [x] G4 parity matrix + scene-snapshot structure goldens
- [x] Soft-present pixel SHA + histogram goldens ([`PIXEL_GOLDENS.md`](rendering/PIXEL_GOLDENS.md))
- [x] PWA: `/gpu/` **separate route** ([`PWA_GPU_ROUTE.md`](PWA_GPU_ROUTE.md) · SW v9)
- [x] Simulated P0 Ultra QA ([`SIMULATED_ULTRA_QA.md`](SIMULATED_ULTRA_QA.md))

## Recommended next steps (priority order)

### Optional — hardware Ultra fps

Simulated stand-in already passed. When a discrete desktop is available:

1. NVIDIA / AMD / Intel → `/gpu/` HUD: adapter · band ultra · tier ultra · fps/budget **ok**
2. Promote matrix Notes from `simulated` → measured fps

Guide: [`DESKTOP_GPU.md`](DESKTOP_GPU.md).

### Optional — polish

| Item | Notes |
| --- | --- |
| Full R3F WebGPU stills | Needs GPU CI runner; soft-present goldens already in CI |
| Vendor Draco WASM / Basis transcoder | Bridges ready; not required for ship |
| Legacy WebGL 1:1 shaders | Only if keeping `/` long-term parity |
| CUDA/HIP workers | Compose `nvidia` profile already reserves GPU |
| XR readiness | [`rendering/XR_COMPATIBILITY.md`](rendering/XR_COMPATIBILITY.md) |

### Explicitly deferred

- Native iOS (`docs/IOS_MIGRATION.md`)
- Azure / Render one-click deploys

## Commands

```bash
python3 -m pytest tests/ -q
npm test && npm run gpu:test && npm run gpu:typecheck
npm run gpu:build
npm run gpu:goldens:pixel   # regenerate soft-present pixel goldens
docker compose up -d --build
./scripts/check_nvidia_host.sh   # optional NVIDIA host
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
