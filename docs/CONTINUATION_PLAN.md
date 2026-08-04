# PsyFi Web Continuation Plan

Status: active — **production-ready Docker web ship**; G0–G4 ship gates met; living QA continues  
Scope: **web app / PWA / API only** — native iOS remains deferred (`docs/IOS_MIGRATION.md`).  
Deploy: **Docker only** (`DEPLOYMENT.md`).  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Baseline

| Area | State |
| --- | --- |
| `/api/v1` + **hard freeze** | Done (`psyfi-api-v1-hard-2026-07-25`) — additive I3/I4/I5 fields synced in OpenAPI |
| Legacy Live Experience (Canvas/WebGL) | Done — full shell + I1–I5 + polish + safety transitions |
| ParameterField + SafetyPass | Done |
| Image-seed pipeline | Done + optional spatiotemporal anchors |
| Export-journey | Done + optional spatiotemporal anchors + planner |
| PWA + service worker | Done (root `/sw.js`, shell cache **v40**) |
| GPU Lab route | Done |
| Docker production | Done |

## Instrument & Spatiotemporal Grounding Track

Full plan: [`INSTRUMENT_GROUNDING_PLAN.md`](INSTRUMENT_GROUNDING_PLAN.md).

| ID | Item | Notes |
|----|------|-------|
| **I1** | Non-linear quantized controls + lever-style commits | map + stations dial + Neutral lever |
| **I2** | Dual-field / dual-timeline hold-and-compare | wipe / blink / split + IndexedDB archive |
| **I3** | Optional spatiotemporal anchors | lat/lon + year + hour + solar elevation |
| **I4** | Explicit planner stage | `psyfi.planner.v1` + `/visualize/planner` |
| **I5** | First-class Journey objects | `psyfi.journey.v1` + IndexedDB `journeys` |

### Active queue

- [x] **I1** — instrument map + Neutral lever + shell wiring
- [x] **I2** — pin / wipe / blink / split + IndexedDB comparison archive
- [x] **I3** — `psyfi.spatiotemporal_anchor.v1` on image-seed + export-journey (+ shell UI)
- [x] **I4** — deterministic planner (`psyfi.planner.v1`, motifs + lighting notes)
- [x] **I5** — Journey objects (`psyfi.journey.v1`, IndexedDB archive + restore)
- [x] Station dial + live solar lighting modulator polish
- [x] Lever commits — export-journey confirm + seed lock/unlock
- [x] WebGL hold-and-compare parity (pin FBO + wipe/blink/split)
- [x] Journey `comparison_id` link + restore hardening
- [x] Safety-clamped soft crossfades (`transitionSurface.js`) for phase, Neutral, journey load — Canvas + WebGL

## Next recommended (post-#83/#84 reanalysis, 2026-08-04)

Ranked by severity/value. All pure in-repo unless noted. Do **not** redo I1–I5 / station dial / solar / levers / WebGL wipe-blink / `comparison_id` / safety transition landings.

### 1. Doc + schema drift sync (high — cheap, blocks accurate onboarding)

SW / product docs still cite pre-I4 versions; JSON schemas lag live packets.

| Drift | Current truth | Stale refs |
| --- | --- | --- |
| Shell cache | `psyfi-shell-v40` in `psyfi_api/static/sw.js` | `README.md` **SW v25**; `PRODUCTION_READINESS.md` **SW v28**; `ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md` **v30**; `BROWSER_CAPABILITY_MATRIX.md` **SW v30** |
| Product API surface | `/visualize/planner`, `/visualize/journey` live | `VISUAL_EXPERIENCES.md` API table omits them; no transition / instrument-map callouts beyond one I3–I5 bullet |
| Image-seed / export docs | `include_planner` + anchors on export | `IMAGE_SEED_PIPELINE.md` omits planner embedding; `docs/schemas/psyfi_export_journey.v1.json` / `psyfi_image_seed.v1.json` omit `planner` / `spatiotemporal_anchors` |
| Schema files | `psyfi.planner.v1` / `psyfi.journey.v1` in Python | No `docs/schemas/psyfi_planner.v1.json` / `psyfi_journey.v1.json` |
| Freeze human list | OpenAPI freeze has routes | `docs/contracts/frozen/API_V1_FREEZE.md` canonical route list omits planner + journey |
| Receipt “Next” | Engines split + WebGL + sensors landed | `ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md` still lists WebGL port / camera / motion as next; claims engines live inside `experiencePlayer.js` |

**Acceptance:** All SW citations say **v40** (or “see `sw.js` CACHE_NAME”); VISUAL_EXPERIENCES documents I1–I5 + transitions + planner/journey routes; IMAGE_SEED documents `include_planner` + anchors; schema JSON files match Python builders; API_V1_FREEZE route list includes planner/journey; receipt Known limitations / Next rewritten to post-I5 reality.  
**Hardware:** no.

### 2. Client helper unit tests (high — behavior unguarded)

`tests/test_planner_journey.py` covers Python I4/I5; shell tests only assert string presence. No behavioral coverage for:

- `psyfi_api/static/viz/transitionSurface.js` (`ease`, `progress`, `makeTransitionState`, reduced-motion → duration 0, `compositeCrossfade`)
- `psyfi_api/static/viz/compareSurface.js` (`compositeWipe` / `compositeSplit` / `blinkShowPinned` / archive record)
- `psyfi_api/static/viz/instrumentMap.js` (map/inverse/stations round-trip)

**Acceptance:** Node or pytest+execjs suite asserting numeric invariants (smoothstep endpoints, wipe edge column, stations quantize, reduce-motion skips transition). Static wiring tests remain.  
**Hardware:** no.

### 3. WebGL split dual-viewport parity (medium-high — half-finished I2 polish)

Canvas `compareSurface.compositeSplit` scales each half to full field width. WebGL `parameterFieldWebGL.js` split branch is a hard mid cut (`step(0.5, v_uv.x)`) — not dual-viewport. Wipe/blink FBO path is done; split is the remaining parity hole. Also opportunistic: document intentional delta vs fix.

**Files:** `psyfi_api/static/viz/parameterFieldWebGL.js` (shader + pin UV remap), optionally `docs/INSTRUMENT_GROUNDING_PLAN.md` / `VISUAL_EXPERIENCES.md`.  
**Acceptance:** WebGL split left/right each show full pinned/live field (same semantics as Canvas); blink-under-reduced-motion → split still correct; Prefer-WebGL smoke in static tests or a golden note.  
**Hardware:** soft GPU helpful for visual check; logic verifiable in-repo / headless WebGL optional.

### 4. Journey transition kind + restore wiring (medium — dead kind / incomplete shell)

`transitionSurface.KINDS` includes `'journey'` with 450 ms duration, but nothing calls `beginTransition('journey')`. Journey restore (`psyfi:restore-journey` in `app.js`) clicks Load → `loadTimeline` → `beginTransition('load')`. Functionally similar duration; kind is dead / mislabeled for provenance.

**Files:** `psyfi_api/static/app.js`, `psyfi_api/static/viz/experiencePlayer.js`, `psyfi_api/static/viz/transitionSurface.js`.  
**Acceptance:** Restore path (or explicit journey-load API) calls `beginTransition('journey')`; load vs journey kinds distinguishable; reduced-motion + compare-active still skip; static test asserts `beginTransition('journey')` or equivalent.  
**Hardware:** no.

### 5. Living product-doc depth for I4/I5 (medium-low — follows #1)

After schema sync: expand `VISUAL_EXPERIENCES.md` Safety/Modes with Neutral lever, instrument map modes, hold-and-compare, transition kinds; expand `IMAGE_SEED_PIPELINE.md` with planner sidecar + Journey vs export-journey distinction; bump `BROWSER_CAPABILITY_MATRIX` automation row for I4/I5/transition modules (still not a ship gate).

**Hardware:** no (matrix device re-measure remains optional living QA / hardware).

## Supporting patterns landed

- [x] Safety-clamped soft crossfades (`transitionSurface.js`) for phase, Neutral, journey load — Canvas + WebGL; skipped under reduced motion and when hold-and-compare is active.

## Out of scope / do not reopen

- Re-landing I1–I5 core, station dial, solar modulator, export/seed levers
- Re-doing WebGL wipe/blink pin FBO path or journey `comparison_id` link
- Native iOS; in-app LLM/T2V providers; server-side journey storage

## Run

```bash
docker compose up -d --build
python3 scripts/run_dev_server.py
```

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
