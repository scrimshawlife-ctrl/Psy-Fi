# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G0–G4 ship gates met; living QA continues  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) |
| Legacy Live Experience (Canvas/WebGL) | Done |
| ParameterField + SafetyPass | Done |
| Image-seed pipeline | Done |
| Export-journey | Done |
| PWA + service worker | Done |
| GPU Lab route | Done |
| Docker production | Done |

## Instrument & Spatiotemporal Grounding Track (new — 2026-07-31)

Full plan: [`INSTRUMENT_GROUNDING_PLAN.md`](INSTRUMENT_GROUNDING_PLAN.md).

| ID | Item | Notes |
|----|------|-------|
| **I1** | Non-linear quantized controls + lever-style commits | intensity map + Neutral lever |
| **I2** | Dual-field / dual-timeline hold-and-compare | pin + wipe / blink / split |
| **I3** | Optional spatiotemporal anchors | lat/lon + year + hour + solar elevation |
| **I4** | Explicit planner stage | deterministic first |
| **I5** | First-class Journey objects | IndexedDB-archivable |

### Active — Instrument & Spatiotemporal Grounding

- [x] **I1** Non-linear quantized controls + lever-style commits — intensity map + Neutral lever + shell wiring complete in local validated files
- [~] **I2** Dual-field / dual-timeline hold-and-compare — `compareSurface.js` + ExperiencePlayer `pinFrame` / `setCompareMode` / `setWipePosition` / `getComparisonPacket` + renderer hooks landed; canvas dual-draw (wipe composite) and minimal Pin chrome next
- [ ] **I3** Optional spatiotemporal anchors on image-seed / export-journey
- [ ] **I4** Explicit planner stage (deterministic first)
- [ ] **I5** First-class Journey objects

## Next recommended

1. Canvas wipe composite inside ExperienceRenderer.draw (use `compareSurface.compositeWipe`).
2. Minimal Pin button + Compare mode control in Live Experience chrome.
3. Ensure `compareSurface.js` is loaded from index.html / app shell.

## Run

```bash
docker compose up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
