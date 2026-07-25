# Phase 4 — Web Usability Checklist

Status: living evidence log (recommended continuous QA; **not** a production ship blocker)  
Scope: web / PWA only  
Related: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md), [`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md), [`contracts/frozen/API_V1_FREEZE.md`](contracts/frozen/API_V1_FREEZE.md)

## What this is

Structured **human** evidence that the product is understandable and safe to use on real devices. Contract hard freeze and Docker production readiness no longer wait on this table; keep filling it when hardware is available.

## Core workflows to validate

1. Configure grid → run cancellable job → inspect metrics/heatmap → save/export session
2. Pick substance + experience recipe → choose mode → set intensity → play field → Neutral View
3. Scrub phase timeline; regenerate seed; reload same seed → same timeline hash
4. Offline: shell loads; simulation blocked with explicit messaging; history restore/import works
5. Install prompt / Add to Home Screen; SW update does not wipe local history
6. Optional modulators (camera / motion / MIDI / audio / haptics) only affect ParameterField; never bypass safety
7. `/gpu/` (when WebGPU available): scene loads from `scene-snapshot`; Neutral View and luminance/flash limits remain calm

## Interpretability checks

- Users understand outputs are **modeled phenomenology**, not medical findings
- Provenance panel shows authority labels (`OBSERVED` / `INFERRED`)
- Substance fields look distinct (LSD geometry vs psilocybin bloom vs DMT lattice)
- Safety: Reduce motion / Dim flashing / Neutral View are discoverable

## Evidence log

| Date | Browser / device | Workflow | Result | Notes |
|---|---|---|---|---|
| _pending_ | Safari iOS (current gen) | Live Experience + Neutral | | living QA |
| _pending_ | Chrome Android (current gen) | Install + jobs cancel | | living QA |
| _pending_ | Chrome on newer Apple Silicon Mac | Phase scrub + export + `/gpu/` compute | | living QA — record Mac model |
| _pending_ | Safari on newer Apple Silicon Mac | Live Experience + `/gpu/` if WebGPU | | living QA — record Mac model |
| _pending_ | Chrome on newer Windows 11 PC | Phase scrub + export + `/gpu/` compute | | living QA — record CPU/GPU |
| _pending_ | Edge on newer Windows 11 PC | PWA shell + `/gpu/` | | living QA — record CPU/GPU |
| _pending_ | Firefox on newer Mac or PC | Capability fallbacks | | living QA |

## Exit criteria (optional polish)

When this table and the [browser capability matrix](BROWSER_CAPABILITY_MATRIX.md) have real device rows and no blocking UX defects remain, note the milestone in [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).
