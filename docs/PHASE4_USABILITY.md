# Phase 4 — Web Usability Checklist

Status: draft checklist (evidence collection not yet complete)  
Scope: web / PWA only  
Related: [`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md), [`contracts/frozen/API_V1_FREEZE.md`](contracts/frozen/API_V1_FREEZE.md)

## What this is

Structured **human** evidence that the product is understandable and safe to use on real devices. Completing the evidence log (with the device matrix) is the last gate before promoting `/api/v1` from **soft** to **hard** freeze.

Agents and CI cannot fill this table honestly — someone must click through on each browser/device.

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
| _pending_ | Safari iOS (current gen) | Live Experience + Neutral | | human |
| _pending_ | Chrome Android (current gen) | Install + jobs cancel | | human |
| _pending_ | Chrome on newer Apple Silicon Mac | Phase scrub + export + `/gpu/` compute | | human — record Mac model |
| _pending_ | Safari on newer Apple Silicon Mac | Live Experience + `/gpu/` if WebGPU | | human — record Mac model |
| _pending_ | Chrome on newer Windows 11 PC | Phase scrub + export + `/gpu/` compute | | human — record CPU/GPU |
| _pending_ | Edge on newer Windows 11 PC | PWA shell + `/gpu/` | | human — record CPU/GPU |
| _pending_ | Firefox on newer Mac or PC | Capability fallbacks | | human |

## Exit toward freeze

When this table has real device rows, the [browser capability matrix](BROWSER_CAPABILITY_MATRIX.md) rows are filled, and no blocking UX defects remain, mark `/api/v1` freeze prep complete in `docs/contracts/frozen/API_V1_FREEZE.md` and promote soft → hard freeze in `docs/contracts/frozen/`.
