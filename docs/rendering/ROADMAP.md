# Rendering Roadmap

Status: active  
Platform package: `packages/psyfi-gpu-renderer`

## Phase G0 — Contracts & scaffold (this PR)

- [x] Architecture + budgets + shader/asset/XR docs
- [x] Modular package layout (replaceable subsystems)
- [x] `psyfi.scene_snapshot.v1` Python builder + `/api/v1/visualize/scene-snapshot`
- [x] TS snapshot store / interpolator / render-graph skeleton
- [x] Quality-tier matrices + benchmark harness (node)
- [x] FastAPI `/gpu/` mount + legacy coexistence notes
- [ ] Device matrix evidence (human)

## Phase G1 — GPU present path

- [x] R3F `Canvas` + `three/webgpu` `WebGPURenderer` init
- [x] Procedural crystalline field + ParameterField-driven uniforms
- [x] HDR tone path + exposure driven by ParameterField intensity/energy
- [x] Bloom + color grading + **mandatory** safety attenuator (`PresentPipeline`)
- [x] Adaptive quality: Balanced default; Battery Saver via saveData / mobile / low-battery probe
- [ ] OffscreenCanvas optional path behind flag
- [ ] Device matrix evidence (human; shared with G0)

## Phase G2 — Compute & density

- [x] Flow-field kernels (TS reference + WGSL `flow_advect`)
- [x] Compute-driven particles (instanced `FlowParticleField`; WGSL integrate)
- [x] GPU instancing for crystals (existing) + particle density layer
- [x] Cull + LOD selectors (TS + WGSL; wired into particle draw)
- [x] AssetLoader worker-mode hook (bytes fetch; decode still deferred)
- [x] Dispatch compute via `WebGPURenderer` / TSL (`GpuFlowCompute` + SpriteNodeMaterial; CPU fallback)
- [x] Temporal accumulation / TAA (`afterImage` + `TemporalAccumulate` policy; safety after history)
- [x] Worker glTF/GLB + KTX2 header decode (`asset.worker.ts`; Draco flagged, GPU upload later)

## Phase G3 — Premium desktop stack

- [x] PBR-oriented crystal materials via MaterialSystem descriptors
- [x] SSAO / GTAO in `PresentPipeline` when `post.ssao`
- [x] SSR (ultra/high) + ContactShadows when `post.contactShadows`
- [ ] Volumetric fog
- [ ] Motion blur, DoF, chromatic aberration
- [x] Ultra / High / Balanced AO enablement (battery off)
- [x] CI budget smoke (`budgetSmoke.test.ts`)
- [ ] Profiling overlay polish in `/gpu/` UI

## Phase G4 — Cutover readiness

- Feature parity checklist vs legacy Live Experience
- Visual regression goldens (canonical seeds)
- PWA integration decision (embed vs route)
- [x] Soft → **hard** freeze includes scene-snapshot schema
- Legacy viz marked deprecated (not deleted until iOS/web gates)
- Device matrix: living QA (unfrozen as ship gate)

## Phase G5 — XR readiness

See [`XR_COMPATIBILITY.md`](XR_COMPATIBILITY.md). No blocking dependency on native iOS (`docs/IOS_MIGRATION.md` remains deferred).

## Explicit non-goals (near term)

- Rewriting ABX / Python engines in TS/WASM
- Patching `experiencePlayer.js` / `parameterFieldWebGL.js` toward this stack
- Shipping texture-heavy narrative asset packs as authority
