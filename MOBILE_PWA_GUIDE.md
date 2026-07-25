# PsyFi Mobile Web and PWA Guide

Status: active web-first guidance. See [`PLANS.md`](PLANS.md), [`docs/WEB_ARCHITECTURE.md`](docs/WEB_ARCHITECTURE.md), and [`docs/IOS_MIGRATION.md`](docs/IOS_MIGRATION.md).

## Product Role

The installable PWA is PsyFi's mobile application surface for the current delivery track. Native iPhone work is a separate deferred effort (`docs/IOS_MIGRATION.md`). The web experience validates workflows, rendering, terminology, performance, and demand.

## Supported Experience

### Implemented now (existing web shell)

1. Configure grid size / steps / seed, choose a quick size preset, or pick a substance preset.
2. Run a cancellable server-backed simulation via `/api/v1/jobs` while online.
3. Inspect metrics, provenance, and a Canvas magnitude heatmap (optional WebGPU path).
4. Save/restore sessions via IndexedDB history (with `localStorage` last-session fallback).
5. Export or import portable `psyfi.session.v1` JSON.
6. Install prompt when the browser supports it (iOS: Share → Add to Home Screen).
7. View in-browser capability diagnostics (`/#capabilities`).
8. Open **GPU Lab** at [`/gpu/`](../docs/PWA_GPU_ROUTE.md) — **separate route**, not embedded in the shell.

### Planned (web track)

- Offline compute parity with the Python engine.
- Camera/motion/audio/haptic adapters beyond detection.
- Physical-device installability matrix sign-off.

Camera, motion, MIDI, audio, haptics, WebGPU, persistent storage, and installability remain progressive enhancements. Unsupported capabilities must produce an explicit fallback state and must not block the core online workflow.

## Installation

### iPhone and iPad

1. Open the production HTTPS URL in Safari.
2. Use Share → Add to Home Screen.
3. Launch PsyFi from the installed icon.

Installation availability and behavior vary by operating-system and browser version. PsyFi must remain usable in a normal browser tab.

### Android

Use the browser install prompt or Add to Home Screen command when available.

### Desktop

Supported Chromium-based browsers may expose an install action. Installation is optional and must not change authoritative simulation behavior.

## PWA Requirements

- valid web app manifest;
- production HTTPS;
- versioned service worker;
- install icons and maskable icon;
- deterministic cache invalidation;
- offline application shell;
- explicit online/offline status;
- safe-area support;
- responsive layout from 320 CSS pixels upward;
- no loss of data during service-worker update;
- recovery from interrupted simulations and page suspension.

## GPU Lab route (decided)

`/gpu/` is a **separate** WebGPU surface. The installable PWA `start_url` remains `/`.  
Do not iframe-embed the GPU bundle into Live Experience. Full rationale: [`docs/PWA_GPU_ROUTE.md`](docs/PWA_GPU_ROUTE.md).

- Manifest shortcut **GPU Lab** → `/gpu/` (Chromium).
- Service worker: `/gpu/` is network-first; shell precache does **not** include the GPU `dist/` graph.
- Offline navigation to `/gpu/` falls back to the cached shell (`/`).

## Caching Strategy

Do not use a single cache-first strategy for every resource.

| Resource | Default strategy |
|---|---|
| Versioned static assets | cache-first with immutable hashes |
| HTML/navigation | network-first with cached fallback |
| `/gpu/` Lab (HTML + assets) | network-first; opportunistic asset cache; offline → shell `/` |
| Service worker script | `/sw.js` (root scope · `Service-Worker-Allowed: /` · not `/static/sw.js`) |
| API simulation requests | network-only unless an explicitly versioned local compute path exists |
| Preset/catalog metadata | stale-while-revalidate where safe |
| Saved sessions/results | IndexedDB, not service-worker cache |

Service-worker releases must use named cache versions and delete obsolete caches only after the new worker activates safely.

## Offline Behavior

Offline capability must be described precisely:

- The application shell may load offline after a successful prior visit.
- Locally saved sessions and results may remain inspectable.
- Server-backed simulations are unavailable offline.
- The UI must not imply that a network request succeeded when it was queued or blocked.
- Any future offline compute implementation requires deterministic parity tests against the Python engine.

## Local Persistence

Use IndexedDB for session history and cached results. Every record must include:

- schema version;
- engine/API version;
- seed;
- canonical parameters;
- created and updated timestamps;
- provenance reference;
- result checksum where practical.

Provide migration functions, export before destructive migration, and a user-visible storage reset control.

## Responsive Interaction

- Minimum touch target: 44 by 44 CSS pixels.
- Base input font size: at least 16 CSS pixels on mobile.
- Respect safe-area insets.
- Avoid hover-only controls.
- Keep primary run/cancel controls reachable.
- Permit portrait and landscape unless a workflow has a documented constraint.
- Do not disable user scaling.
- Test with keyboard, screen reader, increased text size, reduced motion, and high contrast.

## Visualization Performance

Start with the widest compatible renderer that meets requirements. WebGPU is optional acceleration, not the baseline.

Performance budgets must be measured on representative physical devices:

- application-shell load and interaction readiness;
- simulation request latency;
- visualization frame time;
- memory growth over repeated runs;
- battery and thermal behavior;
- background/foreground recovery;
- payload and cache size.

Move expensive rendering or transforms to Web Workers where possible. Introduce WebAssembly only after profiling identifies a material bottleneck.

## Permissions and Privacy

- Request sensitive permissions only after a user initiates the relevant feature.
- Explain purpose before camera, motion, MIDI, microphone, or persistent-storage access.
- Provide a usable fallback after denial.
- Do not collect analytics by default until a documented privacy model is approved.
- Never store camera or sensor data implicitly.
- Validate imported files by type, size, shape, and schema version.

## Browser Capability Matrix

Maintain a tested matrix for current supported versions of:

- Safari on iPhone/iPad;
- Chrome on Android;
- Chrome and Edge desktop;
- Firefox desktop where core workflows are expected.

For each capability record: supported, permission model, foreground/background behavior, fallback, and last verified date.

## Quality Gates

A PWA change is complete only after:

- unit and end-to-end tests pass;
- installability is verified;
- update and cache migration paths are tested;
- offline states are tested;
- keyboard and screen-reader smoke tests pass;
- reduced-motion behavior is reviewed;
- physical-device mobile testing is complete;
- performance impact is recorded;
- session compatibility is preserved or migrated.

## Native Transition

Do not default to a generic native wrapper. Capacitor or similar packaging may be evaluated for distribution experiments, but it does not replace the evidence-gated SwiftUI migration defined in [`docs/IOS_MIGRATION.md`](docs/IOS_MIGRATION.md).
