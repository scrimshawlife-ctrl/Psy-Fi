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

[`docs/BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) is a **manual checklist**: someone runs PsyFi on Safari iOS, Chrome Android, and desktop browsers and records whether install, service worker, jobs cancel, Live Experience, `/gpu/`, Neutral View, and reduce-motion behave correctly. CI cannot substitute for those rows. Together with [`PHASE4_USABILITY.md`](PHASE4_USABILITY.md), it blocks **hard** freeze only (soft freeze already landed).

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
- [ ] Dispatch real WebGPU compute pipelines from `WebGPURenderer` (next)
- [ ] Temporal accumulation / TAA wiring
- [ ] Worker glTF/Draco/KTX2 decode (bytes-only fetch is in place)

### Deferred / human

- Legacy WebGL 1:1 engine shaders (optional)
- Device matrix + Phase 4 → hard freeze

### Explicitly out of scope now

- Native iOS
- Patching legacy `experiencePlayer.js` toward the GPU stack
- Azure / Render / Fly / Railway one-click hosts

## Recommended next slice

1. **Merge #30** (P0–P2) when ready.
2. **Human:** fill device matrix + Phase 4 on real phones/desktops.
3. **Engineering:** finish G2 WebGPU compute dispatch + TAA; then G3 premium passes.

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
