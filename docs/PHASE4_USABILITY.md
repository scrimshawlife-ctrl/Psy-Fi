# Phase 4 — Web Usability Checklist

Status: **evidence filled** (2026-07-25 human QA pass) — living log; not a production ship blocker  
Scope: web / PWA only  
Related: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md), [`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md), [`contracts/frozen/API_V1_FREEZE.md`](contracts/frozen/API_V1_FREEZE.md)

## What this is

Structured **human** evidence that the product is understandable and safe to use on real devices. Rows below are from the 2026-07-25 target-device pass (newer Apple Silicon Mac, newer Windows 11 PC, current-gen phones).

## Core workflows to validate

1. Configure grid → run cancellable job → inspect metrics/heatmap → save/export session
2. Pick substance + experience recipe → choose mode → set intensity → play field → Neutral View
3. Scrub phase timeline; regenerate seed; reload same seed → same timeline hash
4. Offline: shell loads; simulation blocked with explicit messaging; history restore/import works
5. Install prompt / Add to Home Screen; SW update does not wipe local history
6. Optional modulators (camera / motion / MIDI / audio / haptics) only affect ParameterField; never bypass safety
7. `/gpu/` (when WebGPU available): scene loads from `scene-snapshot`; Neutral View and luminance/flash limits remain calm

## Interpretability checks

- Users understand outputs are **modeled phenomenology**, not medical findings — ✅ disclaimer visible in shell + `/gpu/` HUD
- Provenance panel shows authority labels (`OBSERVED` / `INFERRED`) — ✅
- Substance fields look distinct (LSD geometry vs psilocybin bloom vs DMT lattice) — ✅ overlays/goldens + visual spot-check
- Safety: Reduce motion / Dim flashing / Neutral View are discoverable — ✅ (`N` Neutral; reduce-motion respected)

## Evidence log

| Date | Browser / device | Workflow | Result | Notes |
|---|---|---|---|---|
| 2026-07-25 | Safari iOS 18.5 · iPhone 15 Pro | Live Experience + Neutral | ✅ pass | Touch Neutral calm; A2HS OK; no WebGPU |
| 2026-07-25 | Chrome Android 127 · Pixel 8 | Install + jobs cancel | ✅ pass | Install CTA + cancel mid-job; history restored |
| 2026-07-25 | Chrome 127 · MacBook Pro M3 | Phase scrub + export + `/gpu/` compute | ✅ pass | Seed reload hash stable; Ultra/High smooth |
| 2026-07-25 | Safari 18.5 · MacBook Pro M3 | Live Experience + `/gpu/` | ✅ pass | WebGPU present; particles slightly lighter than Chrome |
| 2026-07-25 | Chrome 127 · Win11 · Ryzen 7 + RTX 4060 | Phase scrub + export + `/gpu/` compute | ✅ pass | SSR/AO/ContactShadows OK; Neutral clamps flash |
| 2026-07-25 | Edge 127 · Win11 · Ryzen 7 + RTX 4060 | PWA shell + `/gpu/` | ✅ pass | SW update kept IndexedDB; modulators ParameterField-only |
| 2026-07-25 | Firefox 128 · MacBook Pro M3 | Capability fallbacks | ✅ pass | WebGPU unavailable → Canvas/WebGL; core workflow unblocked |
| 2026-07-25 | Chrome 127 · MacBook Pro M3 | Offline shell + blocked sim messaging | ✅ pass | Explicit offline messaging; import/restore OK |
| 2026-07-25 | Chrome Android 127 · Pixel 8 | Audio/haptics modulators | ✅ pass | Opt-in only; safety pass still authoritative |
| 2026-07-25 | **Simulated** Ultra QA (CI) · NVIDIA/AMD/Intel/Apple fixtures | P0 Ultra auto-tier + `/gpu/` + Neutral | ✅ pass (simulated) | No physical dGPU; see `SIMULATED_ULTRA_QA.md` + `tests/fixtures/qa/simulated_ultra_qa.v1.json` |
| 2026-07-25 | **Simulated** Ultra QA · G4 seeds ultra snapshots | scene-snapshot SSR/SSAO + distinct hashes | ✅ pass (simulated) | lsd/42 · psilocybin/7 · dmt/99 |

## Exit criteria

Device matrix + this log filled with no blocking UX defects (2026-07-25). Milestone recorded in [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).
