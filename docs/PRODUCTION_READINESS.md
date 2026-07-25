# PsyFi Production Readiness Board

Status: **production-ready for Docker web ship** (2026-07-25)  
Canonical summary also appears in the root [`README.md`](../README.md).  
Scope: web app / PWA / API — native iOS deferred (`IOS_MIGRATION.md`).

## Board

| Track | Item | Status | Evidence / notes |
| --- | --- | --- | --- |
| Contracts | `/api/v1` hard freeze | **done** | `docs/contracts/frozen/` · `psyfi-api-v1-hard-2026-07-25` |
| Contracts | OpenAPI + schema body drift CI | **done** | `tests/test_frozen_contracts.py`, `test_openapi_contract.py` |
| Contracts | Overlay distinctness goldens | **done** | 13 substances · `test_overlay_goldens.py` |
| Runtime | Deterministic ABX-Core + jobs cancel | **done** | pytest suite |
| Runtime | Live Experience + safety pass | **done** | Canvas/WebGL · Neutral View |
| Runtime | Phenomenology catalog / overlays | **done** | build_experience_catalog |
| Runtime | Modulators (cam/motion/MIDI/audio/haptics) | **done** | ParameterField-only |
| GPU | G0 scaffold + scene-snapshot API | **done** | `/gpu/` · `#26` |
| GPU | G1 present (bloom/grade/exposure/safety) | **done** | `#30` |
| GPU | G2 compute / TAA / asset worker decode | **done** | `#31`–`#33` |
| GPU | G3 premium AO / SSR / contact shadows | **in progress** | GTAO + SSR (ultra/high) + ContactShadows |
| Deploy | Docker-only path | **done** | `DEPLOYMENT.md` · multi-stage GPU `dist/` |
| Deploy | Compose healthcheck (no curl) | **done** | urllib |
| CI | pytest + hallmark + gpu test/typecheck/build | **done** | `.github/workflows/ci.yml` |
| PWA | Installable shell + SW + IndexedDB | **done** | living QA on devices |
| QA | Device capability matrix | **unfrozen** | continuous QA — **not** a ship blocker |
| QA | Phase 4 usability log | **living** | recommended; not a ship blocker |
| Out of scope | Native iOS | deferred | `docs/IOS_MIGRATION.md` |
| Out of scope | Azure / Render one-click | removed | `#28` |

## What “unfrozen device matrix” means

[`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) remains the place to record Safari iOS, Chrome Android, and **newer Mac / Windows PC** results. It is **living continuous QA**. Empty rows no longer block:

- Docker production ship
- `/api/v1` **hard** contract freeze

Fill rows when humans validate; failures that change product fallbacks still update the matrix and in-app capability copy.

## Production ship checklist

1. `python3 -m pytest tests/ -q`
2. `npm test && npm run gpu:test && npm run gpu:typecheck && npm run gpu:build`
3. `docker compose up -d --build` → `/health`, `/ready`, `/`, `/gpu/`
4. Confirm freeze pack: `docs/contracts/frozen/MANIFEST.json` → `hard_frozen`
5. Optional: fill device matrix + Phase 4 on target hardware

## Remaining production polish (non-blocking)

1. G3: SSR / contact shadows / volumetric fog / PBR node materials (ultra/high)
2. Draco/KTX2 WASM GPU upload (beyond header decode)
3. Human device matrix + Phase 4 evidence (continuous)
4. Optional legacy WebGL 1:1 shaders

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
