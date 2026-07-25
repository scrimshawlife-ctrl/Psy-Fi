# `/api/v1` Contract Freeze Prep

Status: **prep** (not yet frozen) — 2026-07-25  
Related: `docs/contracts/openapi.json`, `docs/CONTINUATION_PLAN.md`, `tests/fixtures/experiences/substance_overlay_goldens.v1.json`

## Intent

Prepare a freeze of the public web API and experience/overlay schemas after device QA. Until freeze, additive changes are allowed; breaking renames/removals require a version bump discussion.

## Candidate freeze set

| Surface | Artifact | Notes |
|---|---|---|
| OpenAPI snapshot | `docs/contracts/openapi.json` | CI path-set equality |
| Session schema | `psyfi_core/schemas/session.schema.json` | `api_version: v1` |
| Experience recipe | `docs/schemas/psyfi_experience_recipe.v1.json` | catalog entries |
| Parameter field | `docs/schemas/psyfi_parameter_field.v1.json` | immutable snapshots |
| Overlay goldens | `tests/fixtures/experiences/substance_overlay_goldens.v1.json` | LSD≠psilocybin≠DMT… |

## Canonical routes (do not rename lightly)

- `POST /api/v1/simulate/` (+ legacy `/simulate/`)
- `POST /api/v1/jobs/simulate`, `GET/DELETE /api/v1/jobs/{id}`
- `GET /api/v1/presets/`, `GET /api/v1/presets/{id}`
- `GET /api/v1/experiences`, `GET /api/v1/experiences/{id}`
- `GET /api/v1/substances`
- `POST /api/v1/visualize/parameter-timeline`
- `POST /api/v1/visualize/field-frame`
- `GET/POST /api/v1/telemetry/*`
- `GET /health`, `GET /ready`

## Freeze gates (before marking frozen)

1. Physical-device matrix filled for Safari/Chrome/Edge/Firefox (`docs/BROWSER_CAPABILITY_MATRIX.md`)
2. Overlay golden suite green in CI
3. No unresolved breaking OpenAPI drift
4. Phase 4 usability notes reviewed (`docs/PHASE4_USABILITY.md`)

## Non-claims

Contracts describe modeled simulation/visualization surfaces only — not medical, diagnostic, or therapeutic tools.
