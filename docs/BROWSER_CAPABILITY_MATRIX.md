# Browser Capability Matrix

Status: Phase 1 living document  
Related: [`MOBILE_PWA_GUIDE.md`](../MOBILE_PWA_GUIDE.md), in-app diagnostics panel (`#capabilities`)

The web shell detects runtime support in the current browser. This table records the intended product fallback for each optional capability.

| Capability | Baseline expectation | Fallback when unsupported | Blocks core workflow? |
|---|---|---|---|
| Canvas 2D | Required for heatmap | Metrics + provenance text only | No |
| WebGL | Optional | Canvas 2D renderer | No |
| WebGPU | Optional acceleration (later) | Canvas/WebGL | No |
| IndexedDB | Preferred history store | `localStorage` last session | No |
| Service Worker | Installable shell caching | Online-only static hosting | No |
| Web MIDI | Optional local device control | Server `/api/midi/*` when available | No |
| Persistent Storage | Optional | Best-effort browser storage | No |
| Vibration / Haptics | Optional | Visual state feedback | No |
| Camera / Motion / Mic | Not used in core workflow | Feature remains unavailable | No |

## Verification

- Open `/#capabilities` in Safari (iOS), Chrome (Android/desktop), Edge, and Firefox.
- Record date, browser version, and any fallback UX issues in PR notes when changing capability adapters.
- Core online workflow under test: configure → run → inspect → export/save history.
