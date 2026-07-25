# G4 Cutover Readiness Checklist

Status: **in progress** — Draco/KTX2 GPU upload path landed; parity/goldens still open  
Related: [`ROADMAP.md`](ROADMAP.md), [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md), [`../CONTINUATION_PLAN.md`](../CONTINUATION_PLAN.md)

## Asset GPU path

- [x] Worker + main header decode for glTF / KTX2
- [x] KTX2 level-index parse + uncompressed RGBA8 → `GPUTexture` upload
- [x] Draco WASM decoder bridge (stub + test passthrough; real WASM when vendored)
- [ ] Vendor `draco_decoder.wasm` / Basis transcoder assets into package (optional runtime)
- [ ] Wire uploaded textures/meshes into `SceneRoot` when snapshot `assets.*` is populated

## Feature parity vs legacy Live Experience (`/`)

| Capability | Legacy `/` | `/gpu/` | Notes |
| --- | --- | --- | --- |
| ParameterField authority | yes | yes | scene-snapshot |
| Safety attenuator / Neutral View | yes | yes | PresentPipeline |
| Substance overlays (13) | yes | via snapshot | confirm visual parity |
| Modulators (cam/motion/MIDI/audio/haptics) | yes | partial | map remaining modulators |
| Reduce motion | yes | yes | snapshot flag |
| Offline / PWA | yes | route `/gpu/` | embed-vs-route decision open |

## Visual regression

- [ ] Canonical seed list (match overlay goldens where applicable)
- [ ] Capture `/gpu/` stills or histogram hashes in CI (desktop WebGPU runner or fixture path)
- [ ] Document intentional deltas vs Canvas/WebGL legacy

## PWA decision

- [ ] Keep `/gpu/` as separate route (current) **or** embed in shell
- [ ] Update `MOBILE_PWA_GUIDE.md` after decision

## Exit criteria for G4

1. Parity table filled with no “unknown” rows for ship-critical flows  
2. At least one CI-backed visual smoke for `/gpu/`  
3. Asset upload path documented + tested (uncompressed KTX2 + Draco bridge)  
4. Hard freeze unchanged unless additive OpenAPI synced
