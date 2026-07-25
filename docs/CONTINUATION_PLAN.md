# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G3 polish in flight; device matrix unfrozen  
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
| GPU G3 | GTAO AO wired for desktop tiers; SSR/fog next |
| CI / Docker GPU dist | Done |
| Device matrix | **Unfrozen** — living continuous QA |
| Phase 4 usability | Living continuous QA |

## Device matrix (unfrozen)

[`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) records newer Mac / Windows PC + phone results. Empty rows **do not** block hard freeze or Docker ship.

## Engineering queue

### Done

- P0–P2 continuation + G2 compute/TAA/asset decode
- Hard freeze; production readiness board in README

### In progress — production polish (G3)

- [x] GTAO ambient occlusion on tiers with `post.ssao`
- [x] Crystal materials via MaterialSystem descriptors
- [x] CI budget smoke for tier passes / frame profiler
- [ ] SSR / contact shadows / volumetric fog
- [ ] Full Ultra/High premium stack + profiling overlay in `/gpu/` UI

### Living QA (non-blocking)

- Device matrix rows on target hardware
- Phase 4 usability evidence

## Recommended next slice

1. Finish G3 premium passes (SSR / shadows / fog).
2. Optional: Draco/KTX2 GPU upload.
3. Humans: fill device matrix when hardware is available.

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
