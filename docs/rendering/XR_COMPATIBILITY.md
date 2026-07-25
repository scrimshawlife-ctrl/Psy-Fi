# Future XR Compatibility Plan

Status: forward-looking — **not** a current delivery gate  
Native iOS remains deferred (`docs/IOS_MIGRATION.md`).

## Goals

- Keep render graph / scene snapshots **platform-neutral** so WebXR (and later native Metal) can bind without rewriting analysis.
- Prefer monoscopic OffscreenCanvas today; reserve multiview / layer paths behind `CameraPipeline` adapters.

## WebXR sketch

| Concern | Approach |
| --- | --- |
| Frame loop | `XRSession.requestAnimationFrame` adapter in `Renderer` |
| Cameras | Snapshot camera is logical; XR views override projection per eye |
| UI chrome | DOM overlay or `XRDOMOverlay` — keep Neutral View reachable |
| Performance | Force ≤ Balanced tier in XR; disable SSR/DoF by default |
| Input | XR controllers → modulators channel only (same as MIDI/camera) |

## Apple Silicon / iPhone

- Probe WebGPU; if absent, deep-link to legacy Live Experience
- Battery Saver defaults on `navigator.userAgentData` mobile + thermal hints when available
- KTX2/UASTC for bandwidth; Draco for mesh caches
- No assumption of mouse hover; large Neutral affordance

## Gaussian Splats in XR

Optional High+ only; memory-cap splat counts; always provide crystalline proxy LOD.

## Non-goals now

- Shipping an App Store client
- Hand-tracking phenomenology claims
- Stereo-specific post that breaks safety clamp
