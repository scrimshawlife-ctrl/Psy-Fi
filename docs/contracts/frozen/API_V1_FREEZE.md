# `/api/v1` Contract Freeze

Status: **hard_frozen** — 2026-07-25  
Freeze id: `psyfi-api-v1-hard-2026-07-25`  
Related: `MANIFEST.json`, [`docs/PRODUCTION_READINESS.md`](../../PRODUCTION_READINESS.md), overlay goldens

## Policy

| Change type | Allowed under hard freeze? |
|---|---|
| Additive fields / routes | Yes (update living OpenAPI + re-sync freeze) |
| Rename / remove / semantic break | No — bump API version or open new freeze_id |
| Device QA evidence | Living continuous QA — not required to keep this freeze |

Device matrix / Phase 4 rows are **unfrozen** as ship gates. Keep recording results in [`BROWSER_CAPABILITY_MATRIX.md`](../../BROWSER_CAPABILITY_MATRIX.md).

## Frozen artifacts

Synced via `python3 scripts/sync_frozen_contracts.py`:

| Artifact | Role |
|---|---|
| `openapi.v1.json` | Public route inventory |
| `session.schema.v1.json` | Portable session document |
| `psyfi_experience_recipe.v1.json` | Experience catalog recipe |
| `psyfi_parameter_field.v1.json` | Immutable visual authority |
| `psyfi_visual_frame.v1.json` | Snapshot/timeline/field_frame envelope |
| `psyfi_scene_snapshot.v1.json` | Immutable GPU scene description |
| `substance_overlay_goldens.v1.json` | Distinctness hashes |
| `substance_visual_overlays.v1.json` | Distilled substance visuals |

## Canonical routes (do not rename lightly)

- `POST /api/v1/simulate/` (+ legacy `/simulate/`)
- `POST /api/v1/jobs/simulate`, `GET/DELETE /api/v1/jobs/{id}`
- `GET /api/v1/presets/`, `GET /api/v1/presets/{id}`
- `GET /api/v1/experiences`, `GET /api/v1/experiences/{id}`
- `GET /api/v1/substances`
- `POST /api/v1/visualize/parameter-timeline`
- `POST /api/v1/visualize/field-frame`
- `POST /api/v1/visualize/scene-snapshot`
- `POST /api/v1/visualize/image-seed` (+ `/json` base64 alternate)
- `GET/POST /api/v1/telemetry/*`
- `GET /health`, `GET /ready`

## CI gates

- Living OpenAPI path set matches app (`tests/test_openapi_contract.py`)
- Frozen OpenAPI path set equals living snapshot (`tests/test_frozen_contracts.py`)
- Overlay goldens green (`tests/test_overlay_goldens.py`)

## Resync

```bash
python3 scripts/export_openapi.py
python3 scripts/build_experience_catalog.py
python3 scripts/regenerate_overlay_goldens.py
python3 scripts/sync_frozen_contracts.py
python3 -m pytest tests/test_frozen_contracts.py tests/test_overlay_goldens.py -q
```

## Non-claims

Contracts describe modeled simulation/visualization surfaces only — not medical, diagnostic, or therapeutic tools.
