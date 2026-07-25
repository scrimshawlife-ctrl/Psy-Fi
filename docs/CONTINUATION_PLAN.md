# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G3 desktop stack done; device matrix filled  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | Done + last-sim source plane |
| Phenomenology overlays | 13 overlay substances |
| GPU G0–G2 | Present path, compute, TAA, asset worker decode |
| GPU G3 | GTAO · SSR · shadows · fog · DoF · motion blur · chroma |
| CI / Docker GPU dist | Done |
| Device matrix | **Filled** (2026-07-25) — still living QA |
| Phase 4 usability | **Filled** (2026-07-25) |

## Device matrix

[`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) has target-device rows from the 2026-07-25 human pass. Re-validate after major UI changes; rows are not a freeze gate.

## Engineering queue

### Done

- P0–P2 continuation + G2 compute/TAA/asset decode
- Hard freeze; production readiness board in README

### Done — production polish (G3)

- [x] GTAO ambient occlusion on tiers with `post.ssao`
- [x] Crystal materials via MaterialSystem descriptors
- [x] CI budget smoke for tier passes / frame profiler
- [x] SSR (ultra/high) + ContactShadows
- [x] Atmosphere fog / DoF / motion blur / chromatic aberration
- [x] Device matrix + Phase 4 human evidence (2026-07-25)

### Done — NVIDIA desktop path

- [x] High-performance WebGPU adapter (`powerPreference`)
- [x] RTX 30/40/50 (incl. **5060**) → recommended **Ultra**
- [x] HUD adapter label + `docs/NVIDIA_GPU.md`
- [x] Compose `--profile nvidia` + `scripts/check_nvidia_host.sh`

### Optional next

- Profiling overlay polish in `/gpu/` UI
- Draco/KTX2 WASM GPU upload
- Legacy WebGL 1:1 shaders
- Future CUDA workers (container GPU already reservable)

## Recommended next slice

1. On your RTX 5060 machine: `./scripts/check_nvidia_host.sh` then open `/gpu/` in Chrome/Edge.
2. Optional: Draco/KTX2 GPU upload or `/gpu/` profiling HUD polish.

## Commands

```bash
python3 -m pytest tests/ -q
npm test && npm run gpu:test && npm run gpu:typecheck
npm run gpu:build
docker compose up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
