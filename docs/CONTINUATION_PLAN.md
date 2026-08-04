# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G0–G4 ship gates met; living QA continues  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) — additive I3 fields synced |
| Legacy Live Experience (Canvas/WebGL) | Done — full shell + I1/I2/I3 |
| ParameterField + SafetyPass | Done |
| Image-seed pipeline | Done + optional spatiotemporal anchors |
| Export-journey | Done + optional spatiotemporal anchors |
| PWA + service worker | Done (root `/sw.js`, shell cache **v35**) |
| GPU Lab route | Done |
| Docker production | Done |

## Instrument & Spatiotemporal Grounding Track

Full plan: [`INSTRUMENT_GROUNDING_PLAN.md`](INSTRUMENT_GROUNDING_PLAN.md).

| ID | Item | Notes |
|----|------|-------|
| **I1** | Non-linear quantized controls + lever-style commits | map + shell + `app.js` wiring landed |
| **I2** | Dual-field / dual-timeline hold-and-compare | wipe / blink / split + IndexedDB archive |
| **I3** | Optional spatiotemporal anchors | lat/lon + year + hour + solar elevation |
| **I4** | Explicit planner stage | deterministic first |
| **I5** | First-class Journey objects | IndexedDB-archivable |

### Active queue

- [x] **I1** — instrument map + Neutral lever + shell wiring
- [x] **I2** — pin / wipe / blink / split + IndexedDB comparison archive
- [x] **I3** — `psyfi.spatiotemporal_anchor.v1` on image-seed + export-journey (+ shell UI)
- [ ] **I4** — explicit planner stage (deterministic first)
- [ ] **I5** — first-class Journey objects

## Next recommended

1. **I4** deterministic planner stage (ParameterField + optional anchors → planner text / motifs / lighting notes).
2. **I5** first-class Journey objects (IndexedDB + shell load/save/replay).

## Run

```bash
docker compose up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
