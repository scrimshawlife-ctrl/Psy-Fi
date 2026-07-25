# Phase 4 — Web Usability Checklist

Status: draft checklist (evidence collection not yet complete)  
Scope: web / PWA only

## Core workflows to validate

1. Configure grid → run cancellable job → inspect metrics/heatmap → save/export session
2. Pick substance + experience recipe → choose mode → set intensity → play field → Neutral View
3. Scrub phase timeline; regenerate seed; reload same seed → same timeline hash
4. Offline: shell loads; simulation blocked with explicit messaging; history restore/import works
5. Install prompt / Add to Home Screen; SW update does not wipe local history

## Interpretability checks

- Users understand outputs are **modeled phenomenology**, not medical findings
- Provenance panel shows authority labels (`OBSERVED` / `INFERRED`)
- Substance fields look distinct (LSD geometry vs psilocybin bloom vs DMT lattice)
- Safety: Reduce motion / Dim flashing / Neutral View are discoverable

## Evidence log

| Date | Browser / device | Workflow | Result | Notes |
|---|---|---|---|---|
| _pending_ | Safari iOS | Live Experience + Neutral | | |
| _pending_ | Chrome Android | Install + jobs cancel | | |
| _pending_ | Desktop Chrome | Phase scrub + export | | |
| _pending_ | Firefox | Capability fallbacks | | |
| _pending_ | Edge | PWA shell | | |

## Exit toward freeze

When this table has real device rows and no blocking UX defects remain, mark `/api/v1` freeze prep complete in `docs/contracts/frozen/API_V1_FREEZE.md`.
