# WebGPU / soft-present pixel goldens

Status: **CI-active** (soft-present) · hardware WebGPU capture optional locally

Soft-present layers (not full R3F): crystals · glyphs · metaballs · ribbons · flow particles · optional fixture KTX2 ground band.  
`capturePixelFrame` modes: `soft` (default golden) · `webgpu-palette` (smoke) · `webgpu-unavailable`.  
Related: [`G4_CUTOVER.md`](G4_CUTOVER.md), [`GPU_PERFORMANCE_BUDGET.md`](GPU_PERFORMANCE_BUDGET.md)

## What runs in CI

Ubuntu CI has no reliable headless WebGPU adapter. Pixel goldens therefore use a **deterministic soft-present** of the same scene-snapshot inputs the `/gpu/` path consumes:

1. Export slim snapshots for G4 seeds → `packages/psyfi-gpu-renderer/fixtures/pixel-goldens/*.snapshot.json`
2. Rasterize 64×64 RGBA (crystal placement mirrors `CrystalField`, palette + safety attenuator applied)
3. Lock **SHA-256** of RGBA + **16-bin RGB histogram** + mean RGB in `g4_pixel_goldens.v1.json`
4. Vitest compares on every `npm run gpu:test`

Seeds match [`g4Parity.ts`](../../packages/psyfi-gpu-renderer/src/contracts/g4Parity.ts): lsd/42, psilocybin/7, dmt/99.

## Hardware WebGPU capture (local)

```ts
import { capturePixelFrame } from '@psyfi/gpu-renderer'
await capturePixelFrame(snapshot, { tryWebGpu: true, preferSoft: false })
```

`webgpuPaletteClearCapture` clears a texture with the palette color and readbacks RGBA when `navigator.gpu` works. It is **not** a full R3F still; soft-present remains the scene-structure golden.

## Regenerate

```bash
# After intentional soft-present / snapshot layout changes:
npm run gpu:goldens:pixel
```

## Intentional deltas vs legacy Canvas/WebGL (`/`)

| Aspect | Legacy `/` | `/gpu/` soft pixel golden |
| --- | --- | --- |
| Authority | ParameterField | Same snapshot ParameterField |
| Geometry | Canvas/WebGL experience player | Soft disks at CrystalField instance poses |
| Post | Shell post stack | Safety desat only (no bloom/SSR in soft path) |
| Neutral View | Collapses experience | Soft vignette; no crystals |

Pixel goldens guard **scene distinctness + safety-aware present**, not bit-identical legacy frames.
