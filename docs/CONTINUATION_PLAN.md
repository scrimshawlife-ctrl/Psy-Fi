# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G0–G4 ship gates met; living QA continues  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | **Restored** — full shell from `99f9e44` + I1/I2 chrome |
| ParameterField + SafetyPass | Done |
| Image-seed pipeline | Done |
| Export-journey | Done |
| PWA + service worker | Done (root `/sw.js`, shell cache **v34**) |
| GPU Lab route | Done |
| Docker production | Done |

## Instrument & Spatiotemporal Grounding Track

Full plan: [`INSTRUMENT_GROUNDING_PLAN.md`](INSTRUMENT_GROUNDING_PLAN.md).

| ID | Item | Notes |
|----|------|-------|
| **I1** | Non-linear quantized controls + lever-style commits | map + shell + `app.js` wiring landed |
| **I2** | Dual-field / dual-timeline hold-and-compare | player + Pin/wipe/blink chrome landed; split/archive open |
| **I3** | Optional spatiotemporal anchors | lat/lon + year + hour + solar elevation |
| **I4** | Explicit planner stage | deterministic first |
| **I5** | First-class Journey objects | IndexedDB-archivable |

### Active queue

- [x] **P0 Restore shell** — `index.html` restored from `99f9e44`; root `/sw.js`; full viz script order
- [x] **P0 Finish I1 wiring** — `data-map-mode` + hint; `getExperienceIntensity` / Alt+click linear toggle; Neutral exit confirm
- [x] **I2 player-side** — `compareSurface.js` + ExperiencePlayer pin API + wipe/blink composite
- [x] **I2 chrome** — Pin / Clear pin + Compare mode (off/wipe/blink) + wipe slider; Space toggles blink
- [ ] **I2 split** — dual-viewport split mode
- [ ] **I2 archive** — provenance / IndexedDB comparison pairs
- [ ] **I3** — spatiotemporal anchors on image-seed / export-journey
- [ ] **I4** — explicit planner stage (deterministic first)
- [ ] **I5** — first-class Journey objects

## Next recommended

1. Optional I2 split dual-viewport (side-by-side synchronized phase).
2. Optional I2 archive of comparison pairs into IndexedDB history.
3. I3 spatiotemporal anchors on image-seed / export-journey.

## Run

```bash
docker compose up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
