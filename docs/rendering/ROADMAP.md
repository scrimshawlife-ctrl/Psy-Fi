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

- R3F `Canvas` + `three/webgpu` `WebGPURenderer` init
- Procedural crystalline field + ParameterField-driven uniforms
- HDR render targets + physically based exposure (basic)
- Bloom + color grading + safety clamp pass
- Adaptive quality: Balanced default, Battery Saver probe
- OffscreenCanvas optional path behind flag

## Phase G2 — Compute & density

- GPU flow fields (compute)
- Compute-driven particles (instanced)
- GPU instancing for glyphs / crystals
- GPU culling + LOD
- Temporal accumulation / TAA
- Worker glTF/Draco/KTX2 loader

## Phase G3 — Premium desktop stack

- PBR materials (TSL node materials)
- SSAO, SSR, contact shadows
- Volumetric fog
- Motion blur, DoF, chromatic aberration
- Full Ultra / High tier enablement
- Profiling overlay + CI budget smoke

## Phase G4 — Cutover readiness

- Feature parity checklist vs legacy Live Experience
- Visual regression goldens (canonical seeds)
- PWA integration decision (embed vs route)
- Soft → hard freeze includes scene-snapshot schema
- Legacy viz marked deprecated (not deleted until iOS/web gates)

## Phase G5 — XR readiness

See [`XR_COMPATIBILITY.md`](XR_COMPATIBILITY.md). No blocking dependency on native iOS (`docs/IOS_MIGRATION.md` remains deferred).

## Explicit non-goals (near term)

- Rewriting ABX / Python engines in TS/WASM
- Patching `experiencePlayer.js` / `parameterFieldWebGL.js` toward this stack
- Shipping texture-heavy narrative asset packs as authority
