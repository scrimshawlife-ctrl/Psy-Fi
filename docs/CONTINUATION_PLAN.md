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
- [x] Shell → GPU Lab handoff (`/gpu/?substance&mode&tier…`) + `battery_saver`/`survival` tier aliases
- [x] Vendored Draco/Basis wired for browser decode; SceneAssetLayer async BasisLZ path
- [x] Fixture KTX2 emission (`include_fixture_assets` / `PSYFI_SCENE_ASSETS`) + soft-present layers
- [x] OffscreenCanvas present flag (`?offscreen=1`, same-thread scaffold)
- [x] Worker OffscreenCanvas remoting protocol (`?offscreen=worker` · stub worker)
- [x] R3F still capture API (`r3f-deferred` without GPU CI harness)
- [x] Product art pack schema + `asset_pack_id` attach (empty CI registry)
- [x] Hardware Ultra fps matrix scaffold (synthetic CI samples)
- [x] Simulated P0 Ultra QA ([`SIMULATED_ULTRA_QA.md`](SIMULATED_ULTRA_QA.md))
- [x] Image seed two-pass pipeline ([`IMAGE_SEED_PIPELINE.md`](IMAGE_SEED_PIPELINE.md) · Pass 1 experience conditioner · Pass 2 `modulators.image`)
- [x] Image-seed GPU texture handoff (`assets.images` data-URL · `?image_seed=1` sessionStorage)
- [x] Export journey package + external T2V prompt sidecar (`/visualize/export-journey`)
- [x] Image-seed catalog recommend + `apply_recommended` + one-shot `/visualize/image-seed-journey`

## Active queue (post image-seed polish)

Priority order for the next web-only slices. No calendar estimates — scoped by subsystem impact.

| Priority | Slice | Why | Scope |
| --- | --- | --- | --- |
| **A** | Recommend-before-condition UX | **done** — confirm formula before Pass 1 mutates | `recommend_only` · Suggest formula · local ObjectURL preview |
| **B** | Shell one-shot journey | **done** — Workbench `Seed → journey` | Downloads seed + timeline + T2V JSON; stills via Export journey |
| **C** | Journey export polish | **done** — shared still capture + UI feedback | 2-frame paint wait · still count · prompt length |
| **D** | Top-N formula alternatives | **done** — ranked picks in API + Workbench | `recommended_alternatives[]` · `recommend_top_n` · alt select |
| **E** | Hardware Ultra fps (optional) | Simulated QA already green | Measured samples when discrete GPU available · see below |

### Explicit non-goals (this queue)

- LLM / T2V provider calls in-app (prompt sidecar only)
- Storing raw uploads or conditioned textures server-side
- Breaking ParameterField / SafetyPass authority
- Native iOS / non-Docker deploys

## Recommended next steps (priority order)

### Active — image-seed UX continuum

- [x] **A** Recommend-before-condition (`recommend_only` + shell suggest panel + local preview)
- [x] **B** Surface `/visualize/image-seed-journey` in the Workbench (`Seed → journey`)
- [x] **C** Harden export-journey still capture + prompt feedback
- [x] **D** Top-N recommended alternatives (`recommended_alternatives` + Workbench picker)

### Done — PWA correctness (post-Hallmark)

- [x] Root-scoped service worker (`/sw.js` · `Service-Worker-Allowed: /` · SW v25) so offline shell + `/gpu/` network-first actually run
- [x] Job cancel finalize lock (cancel cannot lose to `completed`)

### Done — critical safety hardening

- [x] Strictest `intensity_cap` (`min` of experience + overlay); reject mismatched experience/substance
- [x] `neutral_view` on multi-frame parameter-timeline + persistent Neutral across phase ticks
- [x] WebGL Live Experience routes through SafetyPass (`u_safetyAtten`)
- [x] Job store concurrency/retention caps; PresentPipeline never raw-presents without safety; worker load seq tokens

### Optional — hardware Ultra fps

Synthetic fps matrix already in CI (`ultraFpsMatrix.ts`). When a discrete desktop is available:

1. NVIDIA / AMD / Intel → `/gpu/` HUD: adapter · band ultra · tier ultra · fps/budget **ok**
2. Replace `fixtures/qa/ultra_fps_matrix.synthetic.v1.json` samples with `source: measured`
3. Promote matrix Notes from `simulated` → measured fps

Guide: [`DESKTOP_GPU.md`](DESKTOP_GPU.md).

### Optional — polish

| Item | Notes |
| --- | --- |
| Full R3F WebGPU still SHAs | API landed (`r3f-deferred`); GPU CI runner still needed to lock `r3f-webgpu` |
| Vendor Draco WASM / Basis transcoder | **done** — `public/vendor/{draco,basis}` · `draco3d` decode · Basis init |
| GPU PresentPipeline dispose on tier rebuild | **done** — dispose effect RTs; quantize particle budgets; worker abort listener cleanup |
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
