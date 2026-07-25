# PsyFi Plans

Status: active
Canonical product sequence: web application → installable PWA → validated mobile web experience → native iPhone application.

## Product Direction

PsyFi is web-first. The existing deterministic Python engine and FastAPI service remain the authoritative computation layer while the browser becomes the primary product surface. Native Apple development begins only after the interaction model, rendering language, information architecture, and performance targets are validated on the web.

## Architectural Invariants

1. Deterministic simulation outputs must be reproducible from versioned inputs, parameters, and seeds.
2. UI, rendering, persistence, and platform integrations must not become authoritative over simulation state.
3. API contracts must be versioned and platform-neutral.
4. Design tokens, schemas, presets, terminology, and asset formats must remain portable to iOS.
5. Browser capability failures must degrade explicitly rather than silently changing behavior.
6. Claims about consciousness or psychedelic states must be presented as modeled outputs, not medical findings.

## Delivery Phases

### Phase 0 — Documentation and Contract Stabilization

- [x] Declare web-first product strategy.
- [x] Preserve Python/FastAPI as the initial computation authority.
- [x] Define web architecture, design system, and iOS migration constraints.
- [ ] Inventory current API routes, response schemas, static assets, and service-worker behavior.
- [ ] Add machine-readable API schemas and representative fixtures.
- [ ] Establish performance and accessibility baselines.

Exit gate: all active implementation work can be traced to a documented contract or acceptance criterion.

### Phase 1 — Web Product Foundation

- [ ] Establish a dedicated frontend application boundary.
- [ ] Build responsive navigation, simulation workspace, preset browser, results inspector, and provenance panel.
- [ ] Centralize design tokens and component states.
- [ ] Add deterministic session serialization and shareable configuration files.
- [ ] Add error boundaries, loading states, empty states, and capability diagnostics.
- [ ] Implement telemetry that is privacy-preserving and disabled by default until governance is approved.

Exit gate: a user can configure, run, inspect, save, restore, and export a simulation from desktop and mobile browsers.

### Phase 2 — Visualization Runtime

- [x] Define a renderer-independent visualization schema.
- [x] Implement Canvas visualization (WebGL/WebGPU optional path deferred).
- [x] Phenomenology catalog → immutable parameter field → multi-engine Live Experience UI.
- [x] Safety pass (flash/luminance clamp), Reduce Motion, Neutral View, provenance panel.
- [ ] Add WebGPU as an optional accelerated path with a tested fallback.
- [ ] Move expensive browser work to Web Workers.
- [ ] Evaluate WebAssembly only where profiling proves material benefit.
- [ ] Establish frame-time, memory, battery, and thermal budgets on device matrix.

Exit gate: representative simulations meet documented visual fidelity and performance budgets on supported devices.

**Partial exit (2026-07-24):** vertical slice shipped — see `docs/ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md`.

### Phase 3 — PWA and Mobile-Web Hardening

- [ ] Replace blanket caching with versioned cache strategies.
- [ ] Support offline shell loading and explicit online requirements for server computation.
- [ ] Add IndexedDB-backed local history with schema migrations.
- [ ] Validate installability, safe-area handling, orientation, touch, reduced motion, and interrupted-session recovery.
- [ ] Test current Safari, Chrome, Edge, and Firefox; publish a capability matrix.

Exit gate: PsyFi is dependable as an installable mobile web application without implying native parity.

### Phase 4 — Product Validation

- [ ] Run structured usability studies.
- [ ] Validate core workflows, terminology, visual hierarchy, and interpretability.
- [ ] Identify which platform limitations materially block the intended experience.
- [ ] Freeze v1 API contracts, design tokens, visualization schemas, and export formats.

Exit gate: evidence supports a native iPhone build and identifies the exact native capabilities required.

### Phase 5 — Native iPhone Application

- [ ] Build a SwiftUI shell against the same versioned API and fixtures.
- [ ] Port renderer-independent schemas and design tokens.
- [ ] Implement Apple-specific camera, motion, haptics, audio, Metal, and persistence adapters only where justified.
- [ ] Preserve cross-platform session files and result exports.
- [ ] Maintain parity tests between web and iOS for deterministic engine outputs.

Exit gate: iPhone adds verified platform value without creating a second product definition.

## Near-Term Work Queue

Priority 0:
- API contract inventory and OpenAPI review.
- Frontend boundary decision based on current repository constraints.
- Design token extraction.
- Accessibility and performance baselines.
- Deterministic session schema.

Priority 1:
- Simulation workspace redesign.
- Results/provenance inspector.
- [x] Visualization schema and renderer prototype (Live Experience + catalog).
- IndexedDB history and import/export.
- Browser capability matrix.

Priority 2:
- Web Workers and optional WASM acceleration.
- WebGPU accelerated renderer.
- Advanced camera, motion, MIDI, audio, and haptic integrations.
- Native iPhone proof of concept after Phase 4 gate.

## Definition of Done

A work item is complete only when implementation, tests, user-facing states, documentation, accessibility behavior, performance impact, and migration implications are addressed. Placeholder UI and undocumented platform-specific coupling do not satisfy completion.
