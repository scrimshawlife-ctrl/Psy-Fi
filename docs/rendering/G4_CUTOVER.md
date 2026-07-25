# G4 Cutover Readiness Checklist

Status: **in progress** — asset GPU path wired into SceneRoot; visual goldens still open  
Related: [`ROADMAP.md`](ROADMAP.md), [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md), [`../CONTINUATION_PLAN.md`](../CONTINUATION_PLAN.md)

## Asset GPU path

- [x] Worker + main header decode for glTF / KTX2
- [x] KTX2 level-index parse + uncompressed RGBA8 → `GPUTexture` upload
- [x] Draco WASM decoder bridge (stub + test passthrough; real WASM when vendored)
- [x] Wire uploaded textures into `SceneRoot` via `SceneAssetLayer` when `assets.ktx2[]` has `{ id, url }`
- [ ] Vendor `draco_decoder.wasm` / Basis transcoder assets into package (optional runtime)
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
| Offline / PWA | yes | partial | `/gpu/` separate route |
| KTX2 / Draco optional assets | n/a | partial | SceneAssetLayer; Python arrays empty by default |

## Visual regression

Canonical seeds (also in `g4Parity.ts`):

| substance | mode | seed | intensity |
| --- | --- | --- | --- |
| lsd | open | 42 | 0.75 |
| psilocybin | attractor | 7 | 0.6 |
| dmt | void | 99 | 0.85 |

- [x] Canonical seed list checked into CI (`g4Parity.test.ts`)
- [ ] Capture `/gpu/` stills or histogram hashes in CI (needs WebGPU runner)
- [ ] Document intentional deltas vs Canvas/WebGL legacy

## PWA decision

- [ ] Keep `/gpu/` as separate route (current) **or** embed in shell
- [ ] Update `MOBILE_PWA_GUIDE.md` after decision

## Exit criteria for G4

1. Parity table filled with no ship blockers (authority + safety = yes) — **met in CI**
2. At least one CI-backed visual smoke for `/gpu/` — **seeds listed; pixel goldens pending WebGPU CI**
3. Asset upload path documented + tested + SceneRoot wired — **met**
4. Hard freeze unchanged unless additive OpenAPI synced — **met**
