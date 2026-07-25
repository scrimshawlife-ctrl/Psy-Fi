# API Contract Inventory

Status: Phase 0 inventory (integrated with existing FastAPI + Pydantic surfaces)  
Related: [`PLANS.md`](../PLANS.md), [`docs/WEB_ARCHITECTURE.md`](WEB_ARCHITECTURE.md), [`docs/FRONTEND_BOUNDARY.md`](FRONTEND_BOUNDARY.md)

## Purpose

Document the live FastAPI surface, static/PWA assets, and service-worker behavior so implementation work can be traced to contracts without introducing a parallel package tree.

## Live HTTP Routes

Canonical browser client paths are under `/api/v1/*`. Legacy `/api/*` and `/simulate/` remain mounted for compatibility.

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| `GET` | `/` | — | HTML shell | Existing Jinja template |
| `GET` | `/health` | — | status dict | Liveness + version |
| `GET` | `/ready`, `/api/v1/ready` | — | readiness dict | Presets/icons/schema checks |
| `GET` | `/api/info`, `/api/v1/info` | — | info dict | Includes `api_version: v1` |
| `POST` | `/simulate/`, `/api/v1/simulate/` | `SimulateRequest` | `SimulateResponse` | Sync path; cancels on disconnect |
| `POST` | `/api/v1/jobs/simulate` | job request | job summary | Canonical async cancellable job |
| `GET` | `/api/v1/jobs/{id}` | — | job summary | Poll status/result |
| `DELETE` | `/api/v1/jobs/{id}` | — | job summary | Request cancel |
| `GET` | `/api/v1/presets/` | — | `PresetListResponse` | Existing substance registry catalog |
| `GET` | `/api/v1/presets/{id}` | — | `PresetDetail` | Id or alias lookup |
| `GET/POST` | `/api/v1/telemetry/*` | opt-in | status/events | Disabled unless env + client consent |
| `GET` | `/api/v1/midi/*` | MIDI models | MIDI models / dicts | Process-global MIDI service |
| `GET` | `/api/v1/experiences` | filters | recipe summaries | Phenomenology catalog |
| `GET` | `/api/v1/experiences/{id}` | — | full recipe | Derived motifs + visual_recipe |
| `GET` | `/api/v1/substances` | — | visual_signature + overlay | Distilled substance visual settings |
| `POST` | `/api/v1/visualize/parameter-timeline` | timeline body | frames + hash | Immutable parameter field snapshots |
| `POST` | `/api/v1/visualize/field-frame` | bounded sim | sim viz + ParameterField | Simulation ↔ experience bridge |
| `*` | `/api/jobs/*`, `/api/presets/*`, `/api/telemetry/*`, `/api/midi/*` | same | same | Legacy mirrors of v1 |
| `GET` | `/assets/icons/*` | — | static files | Mount of existing `docs/icons` |
| `GET` | `/static/*` | — | static files | Existing UI assets + SW |

OpenAPI snapshot: [`docs/contracts/openapi.json`](contracts/openapi.json)  
Regenerate: `python3 scripts/export_openapi.py`

## Machine-Readable Contracts (Existing Tree)

| Artifact | Location | Produced by |
|---|---|---|
| OpenAPI snapshot | `docs/contracts/openapi.json` | `scripts/export_openapi.py` (FastAPI) |
| Session model | `psyfi_core/models/session.py` | Pydantic (same stack as presets/metrics) |
| Visualization model | `psyfi_core/models/session.py` | Pydantic |
| Session JSON Schema | `psyfi_core/schemas/session.schema.json` | `scripts/export_schemas.py` |
| Visualization JSON Schema | `psyfi_core/schemas/visualization.schema.json` | `scripts/export_schemas.py` |
| Substance preset schema | `psyfi_core/presets/substance_schema.json` | pre-existing |
| Design token map | `docs/style/tokens.json` | aliases onto `docs/style/psyfi-colors.css` |
| Session fixture | `docs/contracts/fixtures/session.example.json` | hand-authored from model |

## Simulate Contract (Additive)

`POST /simulate/` now accepts optional `seed` and returns:

- legacy metrics: `valence`, `coherence`, `symmetry`, `roughness`, `richness`, `width`, `height`
- contract metadata: `schema_version`, `engine_version`, `api_version`, `seed`, `provenance_id`, `module_chain`
- embedded `session` document (`PsyFiSession`) for local save/export

`api_version` is `v1` for session documents and simulate/job responses. The web shell calls `/api/v1` exclusively.

## Static Assets and PWA

| Path | Role | Integration note |
|---|---|---|
| `psyfi_api/templates/index.html` | App shell | Progressive enhancement target |
| `psyfi_api/static/app.js` | Client | `/api/v1` jobs/presets; IndexedDB history; install + import |
| `psyfi_api/static/style.css` | UI tokens | semantic aliases → `--pf-*` |
| `psyfi_api/static/sw.js` | Service worker | network-only API; network-first HTML; cache-first `/static` |
| `psyfi_api/static/manifest.json` | Manifest | PNG icons + SVG brand pack |
| `docs/icons/*.svg` | Icon pack | Served via FastAPI mount |
| `docs/style/*.css` | Brand CSS | Source for token aliases |

## Remaining Gaps (web track)

- Physical-device validation against the capability matrix (Safari/Chrome/Edge/Firefox)
- Phase 4 usability validation and formal contract freeze
- OpenAPI breaking-change gate in CI beyond snapshot test
- Native iOS is out of scope for this track (see `docs/IOS_MIGRATION.md`)
