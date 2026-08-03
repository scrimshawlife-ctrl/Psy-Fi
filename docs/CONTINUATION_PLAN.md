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

Distillations from Looking Glass / GL4SS patterns applied to PsyFi’s instrument and generative surfaces while preserving all architectural invariants.

| ID | Item | Notes |
|----|------|-------|
| **I1** | Non-linear quantized controls + lever-style commits | Adaptive spacing for intensity / depth / phase; explicit commit actions; optional solar-elevation bias |
| **I2** | Dual-field / dual-timeline hold-and-compare | Pin + wipe / blink / side-by-side differential analysis in Live Experience |
| **I3** | Optional spatiotemporal anchors | lat/lon + year + hour + solar elevation on image-seed and export-journey paths |
| **I4** | Explicit planner stage | ParameterField + optional anchors → short phenomenological description + motif/lighting notes (deterministic first) |
| **I5** | First-class Journey objects | Bundle substance/mode/timeline/seed/anchors/planner into reproducible IndexedDB-archivable experiences |

### Active — Instrument & Spatiotemporal Grounding (see [`INSTRUMENT_GROUNDING_PLAN.md`](INSTRUMENT_GROUNDING_PLAN.md))

- [x] **I1** Non-linear quantized controls + lever-style commits — intensity map + Neutral lever + shell wiring complete in local validated files; remote index.html carries instrumentMap script and launch structure; full Live Experience body and app.js mapping helpers remain the local source of truth pending final full-payload land
- [ ] **I2** Dual-field / dual-timeline hold-and-compare
- [ ] **I3** Optional spatiotemporal anchors on image-seed / export-journey
- [ ] **I4** Explicit planner stage (deterministic first)
- [ ] **I5** First-class Journey objects

## Next recommended

I2 hold-and-compare (pin + wipe / blink / side-by-side) or complete the remaining full shell payload land for index.html + app.js.

## Run

```bash
#   python3 scripts/merge_ultra_fps_measured.py ~/Downloads/psyfi-ultra-fps-*.json
docker compose up -d --build
./scripts/check_nvidia_host.sh   # optional NVIDIA host
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
