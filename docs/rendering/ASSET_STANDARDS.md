# Asset Standards

## Principle

Prefer **procedural** geometry (glyphs, SDF, ribbons, metaballs, volumes, crystals) over texture-heavy narrative packs. Optional binary assets follow glTF ecosystem standards for interchange and future XR.

## glTF 2.0

- Container: `.glb` preferred (single file).
- Extensions required when used: `KHR_draco_mesh_compression`, `KHR_texture_basisu` (KTX2).
- Materials: metallic-roughness PBR; clearcoat / transmission optional on Ultra.
- Nodes must carry stable `extras.psyfi.node_id` when driven by snapshots.

## Draco

- Compress mesh attributes for crystal/glyph caches generated offline.
- Decode **only** via `AssetPipeline` (`dracoBridge` + optional worker) — never on the render critical path.
- Runtime: `createDracoWasmDecoder({ wasmUrl | impl })` → `planDracoMeshUpload` → `GpuAssetUploader` (vertex/index buffers).
- Until WASM is vendored, Draco glTF plans are **deferred** (`needs: draco-wasm`). Tests use the PSYD passthrough pack.

## KTX2 / BasisU

- Color + normal + ORM atlases when procedural detail is insufficient.
- Prefer UASTC for normals/ORM, ETC1S for color when size-bound (Battery Saver downloads).
- Runtime: worker/main `decodeKtx2Bytes` + `parseKtx2Container` (level index) → `planKtx2Upload`.
- **Uncompressed** RGBA8 (`vkFormat` R8G8B8A8_UNORM, supercompression none) uploads via `queue.writeTexture`.
- BasisLZ / Zstd containers return a **deferred** plan (`needs: basis-transcoder`) until a transcoder is wired.

## Optional Gaussian Splats

- Ingestion format: documented adapter interface `SplatIngestor` (`.ply` / `.splat` / future glTF extension).
- Not required for Live Experience parity.
- Gated behind quality ≥ High and explicit snapshot flag `assets.splats[]`.
- Must degrade to crystalline LOD proxy when unsupported.

## Worker loading + GPU upload

```text
Main / OffscreenCanvas renderer
        ▲ GpuAssetUploader (writeTexture / writeBuffer)
AssetLoader.loadAndUpload
  ├─ planKtx2Upload (uncompressed ready · Basis deferred)
  ├─ planDracoMeshUpload (WASM / deferred)
  └─ planLoadedAssetUpload (glTF structure → deferred)
AssetWorker pool
  ├─ glTF + KTX2 header/meta decode
  └─ Splat (optional)
```

## Repo placement

| Path | Content |
| --- | --- |
| `packages/psyfi-gpu-renderer/public/assets/` | Dev samples (gitkeep / tiny fixtures) |
| Future `data/assets/` | Versioned packs if productized (not authority) |

Simulation / phenomenology catalogs remain under `data/phenomenology/` and are **not** art packs.
