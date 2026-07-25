# PsyFi Web Continuation Plan

Status: active (P0–P2 in #30; G2 compute density in flight; human gates remain)  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`); Azure/Render paths removed (#28).

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + soft freeze | Done (`psyfi-api-v1-soft-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | Done + last-sim source plane (#25) |
| Phenomenology overlays | Expanded (13 overlay substances) — #30 |
| GPU platform G0→G1 | Present path + safety — #30 |
| GPU G2 (start) | Flow particles + cull/LOD kernels + asset worker hook |
| CI / Docker GPU dist | #30 |
| Modulators | Camera / motion / MIDI / audio / haptics |
| Human gates | Device matrix + Phase 4 usability still open |

## What is the “device matrix”?

[`docs/BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) is a **manual checklist**: someone runs PsyFi on current-gen phones plus **newer Apple Silicon Macs** and **newer Windows 11 PCs**, and records whether install, service worker, jobs cancel, Live Experience, `/gpu/` compute, Neutral View, and reduce-motion behave correctly. CI cannot substitute for those rows. Together with [`PHASE4_USABILITY.md`](PHASE4_USABILITY.md), it blocks **hard** freeze only (soft freeze already landed).

## Human gates (block hard freeze)

1. Fill physical-device rows in `docs/BROWSER_CAPABILITY_MATRIX.md`
2. Fill evidence log in `docs/PHASE4_USABILITY.md`
3. Promote soft freeze → **hard freeze** in `docs/contracts/frozen/`

## Engineering queue

### Done (P0–P2 / #30)

- GPU safety attenuator; Compose urllib healthcheck
- G1 bloom / grade / exposure / battery probe
- CI `gpu:build` + Docker `dist/`; freeze body equality
- Phenomenology packs; audio/haptics modulators

### In progress — G2 compute & density

- [x] Portable TS flow / particle / cull / LOD kernels + vitest
- [x] WGSL compute shaders aligned to those kernels
- [x] `FlowParticleField` in scene (disabled on battery / Neutral)
- [x] AssetLoader worker-mode hook (fetch off main when Worker available)
- [x] WebGPU TSL compute dispatch (`GpuFlowCompute`) with CPU InstancedMesh fallback
- [x] Temporal accumulation / TAA wiring (`PresentPipeline` + policy helper)
- [x] Worker glTF/GLB + KTX2 header decode (`decodeAsset` + `asset.worker.ts`)

### Deferred / human

- Legacy WebGL 1:1 engine shaders (optional)
- Device matrix + Phase 4 → hard freeze
- Full Draco/KTX2 GPU upload + WASM decoders (beyond header/meta)

### Explicitly out of scope now

- Native iOS
- Patching legacy `experiencePlayer.js` toward the GPU stack
- Azure / Render / Fly / Railway one-click hosts

## Recommended next slice

1. **Human:** fill device matrix on **newer Mac (Apple Silicon) / newer Windows 11 PC** + current phones → hard freeze.
2. **Engineering:** G3 premium passes (SSAO/SSR/PBR) or Draco/KTX2 GPU upload.

## Commands

```bash
python3 -m pytest tests/ -q
npm test && npm run gpu:test && npm run gpu:typecheck
npm run gpu:build
docker compose up -d --build
python3 scripts/run_dev_server.py
# /        legacy shell
# /gpu/    GPU platform (after build)
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
