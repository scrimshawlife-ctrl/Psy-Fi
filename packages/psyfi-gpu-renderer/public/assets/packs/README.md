# Product art packs

Register pack manifests here as `*.json` (`psyfi.asset_pack.v1`).

- CI ships an **empty registry** (see `docs/contracts/fixtures/asset_pack.empty.v1.json`).
- Product binaries (glTF / KTX2 / splats) are **not** committed until packs are authored.
- Procedural scene geometry remains authoritative when packs are missing or empty.

Snapshot attach: `asset_pack_id` on `/api/v1/visualize/scene-snapshot`.
