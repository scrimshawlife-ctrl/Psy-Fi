# PsyFi Web Continuation Plan

Status: active implementation (2026-07-25)  
Scope: **web app / PWA / API only** — native iOS remains a separate deferred track (`docs/IOS_MIGRATION.md`).  
Basis: Phases 0–3 essentials, `/api/v1`, Live Experience + overlays; this pass advances P0–P2 scaffolding.

## Current baseline

Done on the web track:

- Deterministic Python/FastAPI authority + static shell
- Canonical `/api/v1` (simulate, jobs, presets, telemetry, MIDI, experiences, visualize)
- Simulation workspace: presets, cancelable jobs, Canvas/WebGPU heatmap, IndexedDB history
- Phenomenology catalog (33 recipes) + **rich substance visual overlays** driving `parameter_mapper`
- Live Experience UI: modes, intensity, Neutral View, reduce-motion, provenance
- PWA shell assets, readiness checks, privacy-gated telemetry stub

Authoritative docs: `PLANS.md`, `docs/VISUAL_EXPERIENCES.md`, `docs/ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md`.

## Priority queue (next)

### P0 — Harden what shipped

1. [x] **Physical-device matrix template** — `docs/BROWSER_CAPABILITY_MATRIX.md` checklist (human fill-in still required).
2. [x] **Visual differentiation QA** — `tests/fixtures/experiences/substance_overlay_goldens.v1.json` + `tests/test_overlay_goldens.py`.
3. [x] **Contract freeze prep** — `docs/contracts/frozen/API_V1_FREEZE.md` (freeze after device QA).
4. [x] Reconcile merged web PRs (`#18`, `#21`) into continuation baseline.

### P1 — Make experiences feel distinctly substance-specific

1. [x] **Split Canvas engines** — `static/viz/math.js`, `safetyPass.js`, `engines/index.js`, orchestrator `experiencePlayer.js`.
2. [x] **WebGL ParameterField path** — `static/viz/parameterFieldWebGL.js` (Canvas fallback remains default when 2D context already bound).
3. [x] **Phase timeline UI** — scrubber + phase label + seed regenerate.
4. [x] **Enrich thin substances** — additional 5-MeO / mescaline / ketamine seed recipes; rebuild overlays.
5. [x] **Simulation ↔ Experience bridge** — `POST /api/v1/visualize/field-frame`.

### P2 — Progressive web capabilities (optional, gated)

1. [x] Camera luminance meter → ParameterField modulator (opt-in).
2. [x] Device motion meter → ParameterField modulator (opt-in).
3. [x] MIDI intensity modulator slider (wired through ParameterField; hardware MIDI remains optional).
4. [x] Export timeline JSON + viewport PNG.
5. [x] Phase 4 usability checklist draft — `docs/PHASE4_USABILITY.md` (evidence rows pending).

### Out of scope (parked)

- Native iPhone / SwiftUI / Metal (Phase 5) until Phase 4 evidence exists
- Medical, therapeutic, diagnostic, or “healing” framing
- Bulk republication of third-party trip-report text in the UI

## Suggested next agent slice

Smallest high-value follow-up after this merge:

```text
1. Add tests/fixtures for substance overlay distinctness + timeline goldens
2. Split experiencePlayer engines into static/viz/engines/*
3. Phase timeline scrubber + regenerate-seed control in Live Experience UI
4. Device QA checklist checklist results → docs/BROWSER_CAPABILITY_MATRIX.md
```

Acceptance for that slice:

- Same seed + substance + recipe → stable `timeline_hash`
- LSD / psilocybin / DMT field hashes differ under identical seed/intensity/mode
- Neutral View ≤ intent; flash ≤ 2 Hz defaults; `prefers-reduced-motion` honored
- No medical claims in UI copy

## Local commands

```bash
python3 scripts/build_experience_catalog.py
python3 -m pytest tests/ -q
python3 scripts/run_dev_server.py
# open http://localhost:8000 → Live Experience + Workspace
```

## Non-claims (carry forward)

Modeled phenomenology for research/visualization only. Motifs/parameters are **INFERRED**; source existence is **OBSERVED**. Not medical advice.
