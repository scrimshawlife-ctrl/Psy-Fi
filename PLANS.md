# PsyFi Plans

Status: active
Canonical product sequence: web application → installable PWA → validated mobile web experience. Native iPhone work is a separate later track (parked; see Phase 5).

## Product Direction

PsyFi is web-first. The existing deterministic Python engine and FastAPI service remain the authoritative computation layer while the browser is the primary product surface. **This engineering track focuses only on the web app and PWA.** Native Apple development is deferred to a separate effort after Phase 4 validation; do not block web delivery on iOS work.

## Architectural Invariants

1. Deterministic simulation outputs must be reproducible from versioned inputs, parameters, and seeds.
2. UI, rendering, persistence, and platform integrations must not become authoritative over simulation state.
3. API contracts must be versioned and platform-neutral.
4. Design tokens, schemas, presets, terminology, and asset formats should stay platform-neutral (portable later; not an iOS deliverable now).
5. Browser capability failures must degrade explicitly rather than silently changing behavior.
6. Claims about consciousness or psychedelic states must be presented as modeled outputs, not medical findings.

## Delivery Phases

### Phase 0 — Documentation and Contract Stabilization

- [x] Declare web-first product strategy.
- [x] Preserve Python/FastAPI as the initial computation authority.
- [x] Define web architecture, design system, and iOS migration constraints.
- [x] Inventory current API routes, response schemas, static assets, and service-worker behavior.
- [x] Add machine-readable API schemas and representative fixtures.
- [x] Establish performance and accessibility baselines.
- [x] Decide frontend boundary using existing FastAPI static shell (see `docs/FRONTEND_BOUNDARY.md`).
- [x] Extract design tokens as semantic aliases over existing `--pf-*` CSS.
- [x] Define deterministic session schema via Pydantic + exported JSON Schema.

Exit gate: all active implementation work can be traced to a documented contract or acceptance criterion.

### Phase 1 — Web Product Foundation

- [x] Establish a dedicated frontend application boundary.
- [x] Build responsive navigation, simulation workspace, preset browser, results inspector, and provenance panel.
- [x] Centralize design tokens and component states.
- [x] Add deterministic session serialization and shareable configuration files.
- [x] Add error boundaries, loading states, empty states, and capability diagnostics.
- [x] Implement telemetry that is privacy-preserving and disabled by default until governance is approved.

Exit gate: a user can configure, run, inspect, save, restore, and export a simulation from desktop and mobile browsers.

### Phase 2 — Visualization Runtime

- [x] Define a renderer-independent visualization schema.
- [x] Implement Canvas visualization for Live Experience + simulation heatmap (WebGL path optional).
- [x] Phenomenology catalog → substance visual overlays → immutable parameter field → Live Experience UI.
- [x] Safety pass (flash/luminance clamp), Reduce Motion, Neutral View, provenance panel.
- [x] Add WebGPU as an optional accelerated path for simulation heatmap with Canvas fallback.
- [x] Move expensive heatmap rasterization to Web Workers.
- [x] Evaluate WebAssembly only where profiling proves material benefit.
- [x] Establish frame-time, memory, battery, and thermal budgets (device matrix filled 2026-07-25).

Exit gate: representative simulations meet documented visual fidelity and performance budgets on supported devices.

**Partial exit (2026-07-24 / continued):** visual experience vertical slice + distilled substance overlays — see `docs/ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md`.

### Phase 3 — PWA and Mobile-Web Hardening

- [x] Replace blanket caching with versioned cache strategies.
- [x] Support offline shell loading and explicit online requirements for server computation.
- [x] Add IndexedDB-backed local history with schema migrations.
- [x] Safe-area handling, reduced-motion CSS, and interrupted-session recovery banner.
- [x] Installability assets (maskable PNG icons + readiness checks).
- [x] Capability matrix filled for target Safari/Chrome/Edge/Firefox + phones (2026-07-25); living QA thereafter.
- [x] `/gpu/` kept as a **separate PWA route** (not embedded) — `docs/PWA_GPU_ROUTE.md`.

Exit gate: PsyFi is dependable as an installable mobile web application without implying native parity.

### Phase 4 — Product Validation (web)

- [x] Structured usability evidence log on web/PWA (`docs/PHASE4_USABILITY.md`).
- [x] Validate core workflows, terminology, visual hierarchy, and interpretability (2026-07-25 pass).
- [x] Identify browser/platform limitations (Firefox WebGPU off → legacy fallback; documented).
- [x] Freeze v1 API contracts (`/api/v1` **hard_frozen**), design tokens, visualization schemas, and export formats.
- [x] Simulated Ultra desktop QA stand-in (`docs/SIMULATED_ULTRA_QA.md`); hardware fps optional.

Exit gate: the web product is validated enough to freeze contracts; native work remains optional and separate. **Met 2026-07-25.**

### Phase 5 — Native iPhone Application (deferred / separate track)

Status: **out of scope for current web delivery.** Kept only as a future migration sketch in `docs/IOS_MIGRATION.md`.

- [ ] (Deferred) Build a SwiftUI shell against the same versioned API and fixtures.
- [ ] (Deferred) Port renderer-independent schemas and design tokens.
- [ ] (Deferred) Implement Apple-specific adapters only where justified.
- [ ] (Deferred) Preserve cross-platform session files and result exports.
- [ ] (Deferred) Maintain parity tests between web and iOS for deterministic engine outputs.

Exit gate: not applicable until a dedicated iOS track is opened after Phase 4.

## Near-Term Work Queue

Priority 0:
- [x] API contract inventory and OpenAPI review.
- [x] Frontend boundary decision based on current repository constraints.
- [x] Design token extraction.
- [x] Accessibility and performance baselines.
- [x] Deterministic session schema.

Priority 1:
- [x] Simulation workspace redesign (continue enhancing existing shell).
- [x] Results/provenance inspector enrichment beyond the current panel.
- [x] Visualization schema consumer / Canvas renderer prototype.
- [x] Live Experience + phenomenology catalog + substance visual overlays.
- [x] IndexedDB history replacing interim localStorage.
- [x] Browser capability matrix.

Priority 2:
- [x] Web Workers for heatmap rasterization.
- [x] Optional WebGPU renderer with Canvas 2D fallback.
- [x] Optional WASM acceleration deferred after evaluation (`docs/WASM_EVALUATION.md`).
- [x] Server-side cancellable simulation jobs (`/api/v1/jobs/simulate`).
- [x] Canonical `/api/v1` web API with legacy `/api` mirrors.
- [x] Install prompt hook, session import, and stronger offline empty states.
- Advanced camera, motion, MIDI, audio, and haptic integrations (web-optional).
- Native iPhone work remains parked (separate track).

### Continuation (web-only)

See [`docs/CONTINUATION_PLAN.md`](docs/CONTINUATION_PLAN.md). Ship track landed through G4:

- [x] Device matrix + overlay goldens + `/api/v1` **hard freeze**
- [x] Split engines + WebGL ParameterField path + phase scrubber
- [x] Enriched 5-MeO / mescaline / ketamine seed recipes; sim↔experience bridge
- [x] Optional camera/motion/MIDI modulators + export + Phase 4 evidence
- [x] Last-sim visualization as optional Canvas/WebGL source plane
- [x] GPU platform G0–G4 (`packages/psyfi-gpu-renderer`, multi-vendor Ultra, pixel goldens, PWA route)
- [x] Simulated Ultra QA + living device matrix (hardware fps optional thereafter)

### Instrument & Spatiotemporal Grounding (2026-08-04)

See [`docs/INSTRUMENT_GROUNDING_PLAN.md`](docs/INSTRUMENT_GROUNDING_PLAN.md) and the active queue in [`docs/CONTINUATION_PLAN.md`](docs/CONTINUATION_PLAN.md).

- [x] I1 Non-linear quantized controls — instrument map + Neutral lever + shell wiring
- [x] I2 Dual-field hold-and-compare — wipe / blink / split + IndexedDB archive
- [x] I3 Optional spatiotemporal anchors — image-seed / export-journey + shell
- [ ] I4 Explicit planner stage
- [ ] I5 First-class Journey objects

All slices preserve ParameterField authority, SafetyPass, Python simulation truth, and the existing claim discipline.

## Definition of Done

A work item is complete only when implementation, tests, user-facing states, documentation, accessibility behavior, performance impact, and migration implications are addressed. Placeholder UI and undocumented platform-specific coupling do not satisfy completion.
