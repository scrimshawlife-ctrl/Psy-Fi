# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G3 + multi-vendor Ultra done; device matrix filled  
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
| Desktop Ultra (multi-vendor) | NVIDIA 30/40/50 · AMD RX 6/7/9xxx · Intel Arc · Apple Pro/Max |
| CI / Docker GPU dist | Done |
| Device matrix | **Filled** (2026-07-25) — still living QA |
| Phase 4 usability | **Filled** (2026-07-25) |

## Device matrix

[`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) has target-device rows from the 2026-07-25 human pass (plus AMD/Intel peer rows). Re-validate after major UI changes; rows are not a freeze gate.

## Engineering queue

### Done

- P0–P2 continuation + G2 compute/TAA/asset decode
- Hard freeze; production readiness board in README
- G3 premium desktop stack + multi-vendor Ultra auto-tier

### Done — production polish (G3)

- [x] GTAO ambient occlusion on tiers with `post.ssao`
- [x] Crystal materials via MaterialSystem descriptors
- [x] CI budget smoke for tier passes / frame profiler
- [x] SSR (ultra/high) + ContactShadows
- [x] Atmosphere fog / DoF / motion blur / chromatic aberration
- [x] Device matrix + Phase 4 human evidence (2026-07-25)

### Done — multi-vendor desktop Ultra path

- [x] High-performance WebGPU adapter (`powerPreference`)
- [x] NVIDIA RTX 30/40/50 (incl. **5060**) → **Ultra**
- [x] AMD RX 6000/7000/9000 · Intel Arc · Apple Pro/Max → **Ultra**
- [x] HUD adapter / vendor / perf-band + `docs/DESKTOP_GPU.md` · `docs/NVIDIA_GPU.md`
- [x] Compose `--profile nvidia` + `scripts/check_nvidia_host.sh`
- [x] `/gpu/` profiling HUD (FPS · avg/p95/max · tier budget · full pass list)
- [x] Draco/KTX2 GPU upload path (uncompressed KTX2 + Draco WASM bridge) · `G4_CUTOVER.md`

## Recommended next steps (priority order)

### P0 — Validate on real hardware (human QA)

Ship code is ready; confirm Ultra auto-select and frame comfort on at least one card per vendor band:

1. **NVIDIA RTX 30/40/50** — `./scripts/check_nvidia_host.sh` → Chrome/Edge → `/gpu/` → HUD shows adapter + tier **ultra** + band **ultra** + fps/budget **ok**.
2. **AMD RX 6000/7000/9000** — Adrenalin drivers · force high-perf GPU · same `/gpu/` check.
3. **Intel Arc** (if available) — Arc drivers · force dGPU on hybrid · Ultra band.
4. Spot-check **Battery Saver** clamp (low charge / saveData) still drops Ultra → Balanced.
5. Log notes back into [`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) if anything diverges.

Guide: [`DESKTOP_GPU.md`](DESKTOP_GPU.md).

### P1 — Highest-value optional polish

| Priority | Item | Why |
| --- | --- | --- |
| 1 | `/gpu/` profiling HUD polish | **done** — FPS · avg/p95/max ms · budget vs tier target · full pass list |
| 2 | Draco/KTX2 **WASM GPU upload** | **done** — uncompressed KTX2 → GPUTexture; Draco bridge + mesh buffers; Basis/WASM deferred hooks |
| 3 | G4 cutover smoke | Parity evidence + visual goldens — checklist in [`rendering/G4_CUTOVER.md`](rendering/G4_CUTOVER.md) |

### P2 — Later / opportunistic

- Optional legacy WebGL 1:1 shaders (only if keeping `/` long-term parity)
- PWA embed-vs-route decision for `/gpu/`
- Future CUDA/HIP workers (Compose `nvidia` profile already reserves the GPU; not required for WebGPU)
- XR readiness (`docs/rendering/XR_COMPATIBILITY.md`) — non-blocking

### Explicitly deferred

- Native iOS (`docs/IOS_MIGRATION.md`)
- Azure / Render one-click deploys

## Commands

```bash
python3 -m pytest tests/ -q
npm test && npm run gpu:test && npm run gpu:typecheck
npm run gpu:build
docker compose up -d --build
# NVIDIA host optional:
./scripts/check_nvidia_host.sh
docker compose --profile nvidia up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
