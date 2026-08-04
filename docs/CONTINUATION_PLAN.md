# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G0–G4 ship gates met; living QA continues  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | **Regressed on main** — shell truncated (see below) |
| ParameterField + SafetyPass | Done (player/renderer still present) |
| Image-seed pipeline | Done (API + last-good shell wiring) |
| Export-journey | Done |
| PWA + service worker | Done (good shell registered `/sw.js` root scope) |
| GPU Lab route | Done |
| Docker production | Done |

## Reanalysis (2026-08-04)

HEAD: `5a734a2` — *I2: player-side complete — next is Pin chrome after full index shell*

### Critical finding — `index.html` stub on main

`psyfi_api/templates/index.html` is a **~120-line stub** (launch splash + header/nav only). Live Experience panel, workspace form, results, history, capabilities, and correct script includes are missing.

| Fact | Detail |
| --- | --- |
| Last full shell | `99f9e44` — **558 lines / ~40 455 bytes** |
| Truncation | `f44bb46` (*I1 shell wiring (1/2)*) deleted 558 lines → placeholder |
| False “lands” | `2359ae7`…`3acb331` / `f7e727c` rebuilt splash+nav stubs with comments claiming a ~40 k local file was pushed — **it never was** |
| Tests | `tests/test_static_shell_assets.py` fails immediately (`cancelButton`, `experiencePanel`, etc. absent) |
| SW regression | Stub registers `/static/sw.js`; good shell used `register('/sw.js', { scope: '/' })` |

### I1 status (corrected)

Docs previously marked I1 complete. On main, only partial assets exist:

| Piece | On main? |
| --- | --- |
| `psyfi_api/static/viz/instrumentMap.js` | Yes (`c13eb5e`) |
| `.intensity-instrument` styles in `style.css` | Yes (restored after accidental wipe) |
| `app.js` map helpers / Alt+click / Neutral lever confirm | **No** — never committed (`76b86c9` was docs-only) |
| `index.html` `data-map-mode` + map hint + Neutral lever chrome | **No** — shell is stub |

### I2 status (accurate)

| Piece | On main? |
| --- | --- |
| `compareSurface.js` | Yes |
| `ExperiencePlayer` pin/wipe/blink API + canvas composite | Yes |
| Script tags in stub | Partial (`instrumentMap` / `compareSurface` / `experiencePlayer` / `app`) — missing `math`, `safetyPass`, engines, WebGL, sensors, splash, `renderer.js` |
| Pin / Compare chrome in UI | Blocked on shell restore |

## Instrument & Spatiotemporal Grounding Track

Full plan: [`INSTRUMENT_GROUNDING_PLAN.md`](INSTRUMENT_GROUNDING_PLAN.md).

| ID | Item | Notes |
|----|------|-------|
| **I1** | Non-linear quantized controls + lever-style commits | map helper present; shell + `app.js` wiring **not** on main |
| **I2** | Dual-field / dual-timeline hold-and-compare | player-side done; chrome blocked on shell |
| **I3** | Optional spatiotemporal anchors | lat/lon + year + hour + solar elevation |
| **I4** | Explicit planner stage | deterministic first |
| **I5** | First-class Journey objects | IndexedDB-archivable |

### Active queue

- [ ] **P0 Restore shell** — restore `index.html` from `99f9e44`, keep root-scoped `/sw.js`, restore full viz script order
- [ ] **P0 Finish I1 wiring** — intensity `data-map-mode` + hint; `app.js` `instrumentMap` get/set + Alt+click linear toggle; Neutral exit confirm (lever)
- [x] **I2 player-side** — `compareSurface.js` + ExperiencePlayer pin API + wipe/blink composite
- [ ] **I2 chrome** — Pin button + Compare mode select → `pinFrame()` / `setCompareMode()` (optional spacebar blink + wipe slider)
- [ ] **I2 split** — dual-viewport split mode
- [ ] **I2 archive** — provenance / IndexedDB comparison pairs
- [ ] **I3** — spatiotemporal anchors on image-seed / export-journey
- [ ] **I4** — explicit planner stage (deterministic first)
- [ ] **I5** — first-class Journey objects

## Next recommended (ordered)

1. **Restore** `psyfi_api/templates/index.html` from `99f9e44` (do not rebuild from the stub).
2. **Insert** script order: `math` → `instrumentMap` → `compareSurface` → `safetyPass` → engines → `parameterFieldWebGL` → `deviceSensors` → `experiencePlayer` → `launchSplash` → `renderer` / `app` (match last-good + I2 adds).
3. **Land I1 chrome + `app.js`** wiring against the restored shell (map was never hooked).
4. **Land I2 chrome**: Pin + Compare mode; then optional blink/wipe controls.
5. Confirm `pytest tests/test_static_shell_assets.py` green before further instrument work.

## Run

```bash
docker compose up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
