# Browser Capability Matrix

Status: Phase 3 living document + **P0 device QA checklist**  
Related: [`MOBILE_PWA_GUIDE.md`](../MOBILE_PWA_GUIDE.md), [`docs/CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md), in-app `#capabilities`

The web shell detects runtime support in the current browser. Optional capabilities never block the core online workflow.

| Capability | Baseline expectation | Fallback when unsupported | Blocks core workflow? |
|---|---|---|---|
| Canvas 2D | Required for Live Experience + heatmap | Metrics + provenance text only | No |
| WebGL | Optional ParameterField path | Canvas 2D engines | No |
| WebGPU | Optional heatmap acceleration | Canvas/WebGL | No |
| Web Workers | Heatmap rasterize off main thread | Main-thread Canvas | No |
| IndexedDB | Preferred history store | `localStorage` last session | No |
| Service Worker | Installable shell caching | Online-only static hosting | No |
| Web MIDI | Optional modulator / server MIDI | Manual intensity / REST MIDI | No |
| Camera (`getUserMedia`) | Optional luminance meter → ParameterField | Modulator slider stays manual | No |
| DeviceMotion | Optional tilt → ParameterField | Modulator slider stays manual | No |
| Persistent Storage | Optional | Best-effort browser storage | No |
| Vibration / Haptics | Optional | Visual state feedback | No |
| `beforeinstallprompt` | Optional install CTA | Share → Add to Home Screen | No |

## P0 device verification checklist

Core online workflow: **configure → run/cancel → inspect → export/save**.  
Live Experience workflow: **substance → recipe → mode → intensity → play → Neutral View → phase scrub**.

| Browser / device | Date | Version | Install / A2HS | SW update OK | Jobs cancel | Live Experience | Neutral ≤ intent | Reduce motion | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Safari iOS | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Chrome Android | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Chrome desktop | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Edge desktop | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Firefox desktop | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

## Automation coverage (CI)

- Overlay distinctness goldens: `tests/test_overlay_goldens.py`
- Experience API + determinism: `tests/test_experiences.py`
- Static shell wiring: `tests/test_static_shell_assets.py`

## Recording results

When validating on a physical device, fill a row above and link the PR. Failures that change product fallbacks must update this table and the in-app capability copy.
