# PsyFi Web Continuation Plan

Status: draft (2026-07-25)  
Scope: **web app / PWA / API only** — native iOS remains a separate deferred track (`docs/IOS_MIGRATION.md`).  
Basis: shipped Phases 0–3 essentials, `/api/v1`, Live Experience + distilled substance overlays (PR #21).

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

1. **Physical-device matrix** — Safari iOS, Chrome Android/desktop, Edge, Firefox against `docs/BROWSER_CAPABILITY_MATRIX.md` (install, SW update, Live Experience, Neutral View, reduce-motion).
2. **Visual differentiation QA** — fixed-seed fixtures asserting LSD ≠ psilocybin ≠ DMT engine/palette hashes; golden parameter-timeline snapshots in CI.
3. **Contract freeze prep** — freeze `/api/v1` experience + overlay schemas once device QA passes; keep OpenAPI snapshot gate green.
4. **Close / reconcile open PRs** — ensure `#18` web-foundation work is either merged or superseded by this branch’s `/api/v1` + PWA surface.

### P1 — Make experiences feel distinctly substance-specific

1. **Split Canvas engines** — extract `kaleidoscope`, `organicBloom`, `entityLattice`, `voidExpansion`, `flowField`, `recursiveFeedback`, `neutralView`, `safetyPass` from `experiencePlayer.js` into `static/viz/engines/` (same ParameterField contract).
2. **WebGL port of ParameterField** — same immutable field → shader uniforms; Canvas remains fallback.
3. **Phase timeline UI** — show comeup/peak/plateau/comedown on the Live Experience chrome; scrub `phase_t`.
4. **Enrich thin substances** — add curated positive packs for 5-MeO-DMT, mescaline, ketamine; rebuild overlays via `scripts/build_experience_catalog.py`.
5. **Simulation ↔ Experience bridge** — optional path: `/simulate` / job field → texture input for Live Experience (downsample server-side).

### P2 — Progressive web capabilities (optional, gated)

1. Camera texture input (`getUserMedia`) through ParameterField only — never direct sensor→shader.
2. Device motion / touch modulators with replay fixtures.
3. MIDI as live intensity/mode modulator (existing MIDI routes stay optional).
4. Export: parameter timeline JSON + viewport still (no clinical claims).
5. Usability studies → Phase 4 gate in `PLANS.md`.

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
