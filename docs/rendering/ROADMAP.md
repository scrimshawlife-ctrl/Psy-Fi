# Rendering Roadmap

Status: **G0–G4 ship gates complete** · optional GPU-CI stills / WASM vendors remain  
Platform package: `packages/psyfi-gpu-renderer`  
Cutover: [`G4_CUTOVER.md`](G4_CUTOVER.md) · pixels: [`PIXEL_GOLDENS.md`](PIXEL_GOLDENS.md)

## Phase G0 — Contracts & scaffold

- [x] Architecture + budgets + shader/asset/XR docs
- [x] Modular package layout (replaceable subsystems)
- [x] `psyfi.scene_snapshot.v1` Python builder + `/api/v1/visualize/scene-snapshot`
- [x] TS snapshot store / interpolator / render-graph skeleton
- [x] Quality-tier matrices + benchmark harness (node)
- [x] FastAPI `/gpu/` mount + legacy coexistence notes
- [x] Device matrix evidence (human + simulated Ultra QA — 2026-07-25)

## Phase G1 — GPU present path

- [x] R3F `Canvas` + `three/webgpu` `WebGPURenderer` init
- [x] Procedural crystalline field + ParameterField-driven uniforms
- [x] HDR tone path + exposure driven by ParameterField intensity/energy
- [x] Bloom + color grading + **mandatory** safety attenuator (`PresentPipeline`)
- [x] Adaptive quality: Balanced default; Battery Saver via saveData / mobile / low-battery probe
- [x] Device matrix evidence (shared with G0)
- [ ] OffscreenCanvas optional path behind flag

## Phase G2 — Compute & density

- [x] Flow-field kernels (TS reference + WGSL `flow_advect`)
- [x] Compute-driven particles (instanced `FlowParticleField`; WGSL integrate)
- [x] GPU instancing for crystals (existing) + particle density layer
- [x] Cull + LOD selectors (TS + WGSL; wired into particle draw)
- [x] AssetLoader worker-mode hook (bytes fetch + header/meta decode)
- [x] Dispatch compute via `WebGPURenderer` / TSL (`GpuFlowCompute` + SpriteNodeMaterial; CPU fallback)
- [x] Temporal accumulation / TAA (`afterImage` + `TemporalAccumulate` policy; safety after history)
- [x] Worker glTF/GLB + KTX2 header decode (`asset.worker.ts`)

## Phase G3 — Premium desktop stack

- [x] PBR-oriented crystal materials via MaterialSystem descriptors
- [x] SSAO / GTAO in `PresentPipeline` when `post.ssao`
- [x] SSR (ultra/high) + ContactShadows when `post.contactShadows`
- [x] Atmosphere fog when `post.volumetricFog` (Neutral widens fog)
- [x] Motion blur (velocity MRT), DoF, chromatic aberration (`rgbShift`)
- [x] Ultra / High / Balanced AO enablement (battery off)
- [x] CI budget smoke (`budgetSmoke.test.ts`)
- [x] Device matrix + Phase 4 human QA filled (2026-07-25)
- [x] Multi-vendor Ultra auto-tier (NVIDIA 30/40/50 · AMD RX 6/7/9xxx · Intel Arc · Apple Pro/Max)
- [x] Profiling overlay polish in `/gpu/` UI (FPS · avg/p95/max · tier budget)
- [x] Simulated P0 Ultra QA harness (`qa/simulateUltraQa.ts`)

## Phase G4 — Cutover readiness

- [x] Draco/KTX2 GPU upload path (`ktx2Parse` · `dracoBridge` · `GpuAssetUploader` · `loadAndUpload`)
- [x] Cutover checklist doc [`G4_CUTOVER.md`](G4_CUTOVER.md)
- [x] Feature parity matrix in CI (`g4Parity.ts`) — no ship blockers
- [x] `SceneAssetLayer` wires snapshot `assets.ktx2` into SceneRoot
- [x] Canonical visual seed list (`G4_VISUAL_SEEDS`)
- [x] CPU scene-snapshot structure goldens (`test_g4_scene_goldens.py`)
- [x] Soft-present pixel SHA + histogram goldens (`pixelGolden.test.ts`)
- [x] PWA integration decision — **separate `/gpu/` route** ([`PWA_GPU_ROUTE.md`](../PWA_GPU_ROUTE.md))
- [x] Soft → **hard** freeze includes scene-snapshot schema
- [ ] Full R3F WebGPU stills on GPU CI runner (optional)
- [x] Vendor real Draco WASM / Basis transcoder (`public/vendor/` · `draco3d` · Basis init)
- Legacy viz marked deprecated (not deleted until iOS/web gates)
- Device matrix: living QA (unfrozen as ship gate)

## Phase G5 — XR readiness

See [`XR_COMPATIBILITY.md`](XR_COMPATIBILITY.md). No blocking dependency on native iOS (`docs/IOS_MIGRATION.md` remains deferred).

## Explicit non-goals (near term)

- Rewriting ABX / Python engines in TS/WASM
- Patching `experiencePlayer.js` / `parameterFieldWebGL.js` toward this stack
- Shipping texture-heavy narrative asset packs as authority
