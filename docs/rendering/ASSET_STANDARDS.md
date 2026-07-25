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
- Decode **only** in `AssetPipeline` workers (`draco3d` / three DRACOLoader).
- Never decode on the render critical path.

## KTX2 / BasisU

- Color + normal + ORM atlases when procedural detail is insufficient.
- Prefer UASTC for normals/ORM, ETC1S for color when size-bound (Battery Saver downloads).
- Runtime: KTX2Loader in worker → transfer `ImageBitmap` / GPU texture upload on renderer thread.

## Optional Gaussian Splats

- Ingestion format: documented adapter interface `SplatIngestor` (`.ply` / `.splat` / future glTF extension).
- Not required for Live Experience parity.
- Gated behind quality ≥ High and explicit snapshot flag `assets.splats[]`.
- Must degrade to crystalline LOD proxy when unsupported.

## Worker loading

```text
Main / OffscreenCanvas renderer
        ▲ transferables only
AssetWorker pool
  ├─ glTF + Draco
  ├─ KTX2
  └─ Splat (optional)
```

## Repo placement

| Path | Content |
| --- | --- |
| `packages/psyfi-gpu-renderer/public/assets/` | Dev samples (gitkeep / tiny fixtures) |
| Future `data/assets/` | Versioned packs if productized (not authority) |

Simulation / phenomenology catalogs remain under `data/phenomenology/` and are **not** art packs.
