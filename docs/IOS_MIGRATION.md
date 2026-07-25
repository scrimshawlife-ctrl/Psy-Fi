# Future iPhone Migration

## Principle

The iPhone application is a **separate, deferred track** — not part of current web/PWA delivery. Native work begins only after the web product reaches the Phase 4 validation gate in `PLANS.md`, and only if a dedicated iOS effort is opened. Until then, treat this document as a migration sketch so web contracts stay portable.

## Native Entry Criteria

Begin native implementation only when all are true:

- core web workflows are stable and tested;
- API contracts and session/export schemas are versioned;
- design tokens and terminology are frozen for the target release;
- mobile-web limitations are documented with user evidence;
- native-only capabilities have measurable product value;
- deterministic fixtures exist for parity testing;
- privacy and permission behavior is documented.

## Shared Contracts

The following remain platform-neutral:

- simulation request and response schemas;
- seed and deterministic execution semantics;
- engine, preset, metric, and parameter identifiers;
- session file format;
- provenance records;
- visualization schema;
- design tokens;
- asset manifests;
- content terminology and limitations;
- acceptance fixtures.

## Platform Adapters

| Capability | Web | iPhone |
|---|---|---|
| UI | Web components/React or existing client | SwiftUI |
| API client | Fetch-based typed client | URLSession typed client |
| Persistence | IndexedDB | SwiftData or files |
| Rendering | Canvas/WebGL/WebGPU | Metal/MetalKit or RealityKit where justified |
| Camera | MediaDevices | AVFoundation |
| Motion | DeviceMotion/Orientation APIs | Core Motion |
| Audio | Web Audio | AVAudioEngine |
| Haptics | Vibration API where available | Core Haptics |
| MIDI | Web MIDI where supported | Core MIDI |
| Files | File APIs/share mechanisms | Files/ShareLink/document picker |

Platform adapters may enrich interaction but must not alter authoritative engine results.

## Recommended Native Architecture

```text
PsyFiApp
  ├─ Presentation (SwiftUI)
  ├─ Application workflows
  ├─ Generated/shared contracts
  ├─ API client
  ├─ Session persistence
  ├─ Visualization adapter
  ├─ Capability adapters
  └─ parity fixtures/tests
          │ HTTPS / versioned JSON
      PsyFi FastAPI service
          │
      deterministic Python core
```

An embedded native port of the simulation engine is a separate decision. It requires performance evidence, a compatibility plan, and cross-language numerical parity tests. It must not be assumed during the first iPhone release.

## Migration Workstreams

1. Generate Swift models from stable OpenAPI/JSON Schema contracts.
2. Port design tokens into generated Swift resources.
3. Reproduce core web workflows in SwiftUI.
4. Implement session import/export parity.
5. Implement the visualization schema in Metal or another justified renderer.
6. Add native capability adapters incrementally.
7. Run parity tests against golden fixtures.
8. Validate accessibility with VoiceOver, Dynamic Type, reduced motion, increased contrast, and switch control.
9. Validate energy, thermal, memory, and background behavior on physical devices.

## Non-Goals for Initial iPhone Release

- rewriting the full Python engine in Swift;
- introducing iOS-only terminology or data formats;
- replacing server authority without evidence;
- adding AR solely because the platform supports it;
- forking the design system;
- claiming feature parity where browser or native capabilities differ.

## Parity Gate

A native release may diverge visually where platform conventions require it, but it must preserve:

- equivalent workflow outcomes;
- identical canonical identifiers;
- compatible session files;
- deterministic output fixtures within declared numerical tolerances;
- equivalent provenance visibility;
- equivalent accessibility and privacy intent.
