# API Contract Inventory

Status: Phase 0 inventory (integrated with existing FastAPI + Pydantic surfaces)  
Related: [`PLANS.md`](../PLANS.md), [`docs/WEB_ARCHITECTURE.md`](WEB_ARCHITECTURE.md), [`docs/FRONTEND_BOUNDARY.md`](FRONTEND_BOUNDARY.md)

## Purpose

Document the live FastAPI surface, static/PWA assets, and service-worker behavior so implementation work can be traced to contracts without introducing a parallel package tree.

## Live HTTP Routes

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| `GET` | `/` | — | HTML shell | Existing Jinja template |
| `GET` | `/health` | — | status dict | Liveness + version |
| `GET` | `/ready` | — | readiness dict | Presets/icons/schema checks |
| `GET` | `/api/info` | — | info dict | Pre-`/api/v1` info surface |
| `POST` | `/simulate/` | `SimulateRequest` | `SimulateResponse` | Sync path; cancels on disconnect |
| `POST` | `/api/jobs/simulate` | job request | job summary | Async cancellable job |
| `GET` | `/api/jobs/{id}` | — | job summary | Poll status/result |
| `DELETE` | `/api/jobs/{id}` | — | job summary | Request cancel |
| `GET` | `/api/presets/` | — | `PresetListResponse` | Existing substance registry catalog |
| `GET` | `/api/presets/{id}` | — | `PresetDetail` | Id or alias lookup |
| `GET/POST` | `/api/telemetry/*` | opt-in | status/events | Disabled unless env + client consent |
| `GET` | `/api/midi/*` | MIDI models | MIDI models / dicts | Process-global MIDI service |
| `GET` | `/assets/icons/*` | — | static files | Mount of existing `docs/icons` |
| `GET` | `/static/*` | — | static files | Existing UI assets + SW |

OpenAPI snapshot: [`docs/contracts/openapi.json`](contracts/openapi.json)  
Regenerate: `python scripts/export_openapi.py`

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

`api_version` remains `v0` until `/api/v1` routes are introduced.

## Static Assets and PWA

| Path | Role | Integration note |
|---|---|---|
| `psyfi_api/templates/index.html` | App shell | Progressive enhancement target |
| `psyfi_api/static/app.js` | Client | localStorage session save/restore/export |
| `psyfi_api/static/style.css` | UI tokens | semantic aliases → `--pf-*` |
| `psyfi_api/static/sw.js` | Service worker | network-only API; network-first HTML; cache-first `/static` |
| `psyfi_api/static/manifest.json` | Manifest | icons point at `/assets/icons` (existing SVG pack) |
| `docs/icons/*.svg` | Icon pack | Served via FastAPI mount |
| `docs/style/*.css` | Brand CSS | Source for token aliases |

## Remaining Gaps

- `/api/v1` versioned public routes
- cancellation / timeout for long simulations
- preset catalog + export endpoints
- IndexedDB migrations (localStorage is interim)
- maskable PNG icons for stricter installability checks
- OpenAPI breaking-change gate in CI beyond snapshot test
