# PsyFi Instrument & Spatiotemporal Grounding Plan

Status: **I1 + I2 complete** — 2026-08-04  
Source inspiration: Looking Glass / GL4SS patterns (client-side spatiotemporal image+video instrument, non-linear dial, solar-elevation grounding, multi-stage planner, hold-and-compare, curated journeys).  
Canonical engineering queue: [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md)  
Board: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)

## Intent

Raise the precision and felt agency of the Live Experience instrument while optionally enriching generative surfaces (image-seed, export-journey, T2V sidecars) with coherent external anchors. All work remains inside existing invariants:

- Simulation truth stays in Python / ABX-Core.
- Visual authority is the immutable `PsyFiParameterField` (or derived scene-snapshot).
- Mandatory SafetyPass is never bypassed.
- Claims stay modeled / research / visualization only (OBSERVED / INFERRED / SPECULATIVE discipline).
- No medical, therapeutic, or diagnostic language.
- No server-side storage of raw uploads or conditioned textures.
- No in-app LLM / T2V provider calls (prompt sidecar only, same as current export-journey).

## Priority slices

No calendar estimates. Ordered by instrument impact vs. architectural surface area.

### I1 — Non-linear quantized controls + lever-style commits (highest leverage)

**Progress (2026-08-04)**
- [x] `psyfi_api/static/viz/instrumentMap.js` — pure UI↔intensity mapping (smoothstep + power, inverse, optional quantize)
- [x] `style.css` `.intensity-instrument` hint styles
- [x] Intensity range uses instrument map by default; Alt+click toggles linear mode
- [x] Display shows mapped intensity value (API still receives 0–1 float)
- [x] Neutral exit requires confirm click (lever-style); enter remains one-shot for safety
- [x] Shell wiring: restored `index.html` + `data-map-mode` + hint; `app.js` get/set helpers
- [ ] Optional discrete station dial UI polish
- [ ] Solar-elevation / environmental-lighting modulator
- [ ] Lever commits for export-journey lock / seed locking

**Why**  
Uniform linear intensity/phase ranges under-represent phenomenological scale. A physical-instrument metaphor (dial with adaptive spacing, explicit commit action) increases both precision and user agency without changing the ParameterField contract.

**Scope**
- Non-linear quantization for intensity, phase, or a new “depth / recursion” control (coarse at extremes, finer in the perceptually dense middle, or vice-versa for deep-time style).
- Lever- or commit-style UI for irreversible actions (export-journey lock, Neutral View exit, seed locking).
- Optional solar-elevation or environmental-lighting modulator that can bias ParameterField engines or image-seed conditioning when a realistic substrate is present.
- Hotkey and accessibility parity with existing Neutral View (`N`).

**Non-goals**  
Changing the immutable ParameterField schema itself; any change must remain a presentation / mapping layer on top of the existing field.

### I2 — Dual-field / dual-timeline hold-and-compare

**Progress (2026-08-03)**
- [x] `psyfi_api/static/viz/compareSurface.js` — pure helpers: `makePinPacket`, `makeComparisonPacket`, `compositeWipe`, `blinkShowPinned`, `normalizeMode`
- [x] `ExperiencePlayer` pin API: `pinFrame`, `clearPin`, `setCompareMode`, `setWipePosition`, `setBlinkHz`, `getComparisonPacket`
- [x] `ExperienceRenderer` hooks: `setPinnedFrame`, `setCompareState`
- [x] Canvas wipe + blink composite inside `draw` (presentation-only; SafetyPass still applied to both sides)
- [x] `_rasterizeFrameTo` for pinned-side raster at same LOD
- [x] Player APIs present in `experiencePlayer.js`
- [x] Minimal Pin button + Compare mode control (wipe / blink / split) + wipe slider + Space blink toggle
- [x] Split mode dual-viewport (`compositeSplit` — left pinned, right live)
- [x] Provenance / IndexedDB archive of comparison pairs (`comparisons` store, schema `psyfi.comparison.v1`)

**Why**  
Direct visual differential analysis of two ParameterFields or timelines is high-value research tooling and currently missing.

**Scope**
- Pin two ParameterField snapshots or timeline segments.
- Wipe, blink (spacebar), or side-by-side synchronized-phase comparison in Live Experience.
- Works for substance/mode/intensity differentials and for sensor-/MIDI-modulated vs baseline comparisons.
- Provenance and IndexedDB history store both sides of a comparison when archived.

**Non-goals**  
Altering SafetyPass or introducing new authoritative state outside ParameterField.

### I3 — Optional spatiotemporal anchors

**Why**  
Concrete lat/lon + year + hour + solar elevation produce more coherent external visual layers when generation is used. The anchors become part of the seed/provenance packet.

**Scope**
- Optional fields on image-seed and export-journey paths: latitude, longitude, year (or ISO timestamp), hour, solar elevation (or auto-derived).
- Anchors flow into the planner description (I4) and into any T2V prompt sidecar.
- Curated experience recipes may optionally declare default anchors.
- Fully deterministic: same anchors + same seed → same planner output and same visual path.

**Non-goals**  
Making spatiotemporal data required; making it the source of truth for the consciousness field itself; any map UI beyond a minimal coordinate picker if needed.

### I4 — Explicit planner stage

**Why**  
A short textual phenomenological description produced from ParameterField + optional anchors becomes a clean shared contract for internal overlay weighting and for external still/video prompt packages.

**Scope**
- New or extended visualize route (or internal helper) that accepts ParameterField + optional spatiotemporal anchors + optional notes and emits a short planner text + motif list + lighting notes.
- Output is stored with the journey / export package and remains an INFERRED artifact with full provenance.
- Used by image-seed conditioning and by `/visualize/export-journey` T2V sidecars.
- No external model calls inside the core path; planner can be pure deterministic template + ParameterField mapping in v1, with optional later LLM path behind an explicit flag if desired.

**Non-goals**  
Making the planner authoritative over ParameterField; introducing non-determinism into the core simulation loop.

### I5 — First-class Journey objects

**Why**  
Package the above into reproducible, archivable, shareable experiences.

**Scope**
- Journey schema that can bundle: substance + mode + intensity schedule / phase timeline + seed + optional spatiotemporal anchors + planner notes + comparison pair (optional).
- IndexedDB persistence with full provenance packet.
- Shell surface for loading, saving, and replaying journeys.
- Compatible with existing export-journey and image-seed-journey paths.

**Non-goals**  
Server-side journey storage; social/sharing features; any claim that a journey is a therapeutic protocol.

## Supporting patterns (lower priority / opportunistic)

- Immersive but safety-clamped transition shaders (phase change, Neutral View entry/exit, journey load) that respect `prefers-reduced-motion` and the final luminance attenuator.
- Model-swappable client-side generative extensions (OpenRouter-style, user key only) if external still/video generation is ever added beyond the current prompt-sidecar approach.
- Instrument language in UI copy (“dial”, “lever”, “through the glass”) kept quiet and non-theatrical.

## Invariants checklist (must hold for every slice)

- [x] ParameterField remains the sole visual authority.
- [x] SafetyPass remains mandatory and non-bypassable.
- [x] Python / ABX-Core remains simulation truth.
- [x] All new outputs carry provenance and OBSERVED/INFERRED labels where applicable.
- [x] No medical / healing / diagnostic claims in UI or docs.
- [x] Determinism preserved for fixed seeds + parameters + anchors.
- [x] Hard-frozen `/api/v1` contracts only extended via additive, versioned fields or new routes; freeze resync scripts run.

## Integration points

| Slice | Primary surfaces |
| --- | --- |
| I1 | Live Experience chrome, ParameterField mapping layer, hotkeys |
| I2 | Live Experience, IndexedDB history, experiencePlayer |
| I3 | `/api/v1/visualize/image-seed*`, `/visualize/export-journey`, experience recipes |
| I4 | New or extended visualize helper + export packages |
| I5 | Shell Workbench, IndexedDB schema, experience catalog |

## Related docs

- [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md) — living queue
- [`VISUAL_EXPERIENCES.md`](VISUAL_EXPERIENCES.md) — Live Experience product guide
- [`IMAGE_SEED_PIPELINE.md`](IMAGE_SEED_PIPELINE.md) — two-pass seed path
- [`PHENOMENOLOGY_PIPELINE.md`](PHENOMENOLOGY_PIPELINE.md) — catalog derivation
- [`FRONTEND_BOUNDARY.md`](FRONTEND_BOUNDARY.md) — `/` vs `/gpu/`

## Non-claims

Modeled phenomenology for research and visualization only. Not medical advice.
