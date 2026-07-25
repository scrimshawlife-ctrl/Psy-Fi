# G4 Cutover Readiness Checklist

Status: **complete for ship gates** (2026-07-25) — soft-present pixel goldens + simulated Ultra QA in CI; full R3F stills optional  
Related: [`ROADMAP.md`](ROADMAP.md), [`PIXEL_GOLDENS.md`](PIXEL_GOLDENS.md), [`../CONTINUATION_PLAN.md`](../CONTINUATION_PLAN.md), [`../PWA_GPU_ROUTE.md`](../PWA_GPU_ROUTE.md), [`../SIMULATED_ULTRA_QA.md`](../SIMULATED_ULTRA_QA.md)

## Asset GPU path

- [x] Worker + main header decode for glTF / KTX2
- [x] KTX2 level-index parse + uncompressed RGBA8 → `GPUTexture` upload
- [x] Draco WASM decoder bridge (`draco3d` + vendored glTF WASM under `/gpu/vendor/draco/gltf/`)
- [x] Wire uploaded textures into `SceneRoot` via `SceneAssetLayer` when `assets.ktx2[]` has `{ id, url }`
- [x] Vendor `draco_decoder.wasm` / Basis transcoder assets (`public/vendor/` · `scripts/vendor_gpu_codecs.sh`)
- [ ] Populate Python `assets.*` in snapshots when productized packs exist

## Feature parity vs legacy Live Experience (`/`)

Canonical data: `packages/psyfi-gpu-renderer/src/contracts/g4Parity.ts` (CI-tested).

| Capability | Legacy `/` | `/gpu/` | Notes |
| --- | --- | --- | --- |
| ParameterField authority | yes | yes | scene-snapshot |
| Safety attenuator / Neutral View | yes | yes | PresentPipeline |
| Substance overlays (13) | yes | yes | via snapshot procedural |
| Modulators (cam/motion/MIDI/audio/haptics) | yes | partial | MIDI/haptics still legacy-primary |
| Reduce motion | yes | yes | snapshot flag |
| Offline / PWA | yes | partial | `/gpu/` **separate route (decided)** — [`PWA_GPU_ROUTE.md`](../PWA_GPU_ROUTE.md) |
| KTX2 / Draco optional assets | n/a | ready | Vendored codecs; SceneAssetLayer; Python arrays empty by default until packs |

## PWA decision

- [x] Keep `/gpu/` as separate route — **decided**; do not embed in the shell
- [x] `MOBILE_PWA_GUIDE.md` + SW v19 network-first for `/gpu/`
- [x] Manifest shortcut + capabilities panel link to GPU Lab

## Visual regression

Canonical seeds (also in `g4Parity.ts`):

| substance | mode | seed | intensity |
| --- | --- | --- | --- |
| lsd | open | 42 | 0.75 |
| psilocybin | attractor | 7 | 0.6 |
| dmt | void | 99 | 0.85 |

- [x] Canonical seed list checked into CI (`g4Parity.test.ts`)
- [x] CPU scene-snapshot structure goldens (`tests/fixtures/experiences/g4_scene_snapshot_goldens.v1.json`)
- [x] Soft-present pixel SHA + histogram goldens in CI ([`PIXEL_GOLDENS.md`](PIXEL_GOLDENS.md))
- [x] Document intentional deltas vs Canvas/WebGL legacy ([`PIXEL_GOLDENS.md`](PIXEL_GOLDENS.md))
- [ ] Full R3F WebGPU still capture on a GPU CI runner (optional later)

## Exit criteria for G4

1. Parity table filled with no ship blockers (authority + safety = yes) — **met in CI**
2. At least one CI-backed visual smoke for `/gpu/` — **structure + soft-present pixel goldens met**
3. Asset upload path documented + tested + SceneRoot wired — **met**
4. Hard freeze unchanged unless additive OpenAPI synced — **met**
5. PWA embed-vs-route decision — **met** (separate route)
6. Simulated Ultra QA stand-in — **met** ([`SIMULATED_ULTRA_QA.md`](../SIMULATED_ULTRA_QA.md))
