# GPU Lab fixture assets

Tiny deterministic assets for end-to-end SceneAssetLayer wiring.

| File | Format | Role |
| --- | --- | --- |
| `ground_rgba8.ktx2` | Uncompressed RGBA8 KTX2 (32×32) | Soft ground/tint plane |

Emitted into scene-snapshots when `include_fixture_assets=true` or `PSYFI_SCENE_ASSETS=fixtures`.
Product art packs remain deferred — procedural geometry stays authoritative by default.
