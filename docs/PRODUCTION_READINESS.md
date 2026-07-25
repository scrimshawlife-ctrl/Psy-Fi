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
| GPU | G3 premium desktop stack | **done** | GTAO · SSR · ContactShadows · fog · DoF · motion blur · chroma |
| GPU | Desktop discrete Ultra path | **done** | NVIDIA 30/40/50 · AMD RX 6/7/9xxx · Intel Arc · `docs/DESKTOP_GPU.md` |
| Deploy | Docker-only path | **done** | `DEPLOYMENT.md` · multi-stage GPU `dist/` |
| Deploy | Compose healthcheck (no curl) | **done** | urllib |
| CI | pytest + hallmark + gpu test/typecheck/build | **done** | `.github/workflows/ci.yml` |
| PWA | Installable shell + SW + IndexedDB | **done** | device QA 2026-07-25 |
| QA | Device capability matrix | **filled** | newer Mac/PC + current phones — 2026-07-25 |
| QA | Phase 4 usability log | **filled** | 2026-07-25 evidence rows |
| Out of scope | Native iOS | deferred | `docs/IOS_MIGRATION.md` |
| Out of scope | Azure / Render one-click | removed | `#28` |

## Device matrix

[`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) is filled for target-class hardware (2026-07-25). It remains living continuous QA and is **not** a ship gate for future additive work.

## Production ship checklist

1. `python3 -m pytest tests/ -q`
2. `npm test && npm run gpu:test && npm run gpu:typecheck && npm run gpu:build`
3. `docker compose up -d --build` → `/health`, `/ready`, `/`, `/gpu/`
4. Confirm freeze pack: `docs/contracts/frozen/MANIFEST.json` → `hard_frozen`
5. Device matrix + Phase 4 filled (2026-07-25)

## Desktop GPU note

Python simulation does **not** use CUDA/HIP. Discrete GPUs (NVIDIA RTX **30/40/50**, AMD RX **6000/7000/9000**, Intel **Arc**, Apple Pro/Max) accelerate `/gpu/` through **browser WebGPU**. Setup: [`DESKTOP_GPU.md`](DESKTOP_GPU.md) · NVIDIA Compose: [`NVIDIA_GPU.md`](NVIDIA_GPU.md).

## Recommended next steps

Canonical queue: [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md).

| Priority | Action | Owner |
| --- | --- | --- |
| **P0** | Validate Ultra auto-tier on real NVIDIA / AMD / Intel desktops via `/gpu/` | Human QA |
| **P1** | Profiling HUD polish in `/gpu/` (FPS · avg/p95/max · budget) | **done** |
| **P1** | Draco/KTX2 WASM GPU upload beyond header decode | **done** (Basis/real Draco WASM optional) |
| **P1** | G4 cutover: parity matrix + SceneAssetLayer | **done** (pixel goldens pending WebGPU CI) |
| **P1** | G4 scene-snapshot structure goldens | **done** (`test_g4_scene_goldens.py`) |
| **P1** | PWA: keep `/gpu/` as separate route | **done** · `docs/PWA_GPU_ROUTE.md` · SW v9 |
| **P1** | Soft-present pixel SHA + histogram goldens | **done** · `docs/rendering/PIXEL_GOLDENS.md` |
| **P2** | Full R3F WebGPU stills on GPU CI runner | Eng · optional |
| **P2** | Re-run device matrix after major UI changes | QA |
| **P2** | Optional legacy WebGL 1:1 shaders; future CUDA workers | Eng (opportunistic) |

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
