# GPU Performance Budget

Status: target for `packages/psyfi-gpu-renderer`  
Extends (does not replace) shell budgets in [`PERFORMANCE_BUDGETS.md`](../PERFORMANCE_BUDGETS.md).

## Device classes

| Class | Examples | Default tier |
| --- | --- | --- |
| Desktop discrete / high Apple Silicon | M-series Max/Pro, dGPU Chromebooks | High (Ultra opt-in) |
| Apple Silicon laptop | M1–M3 laptop | Balanced |
| Future iPhone (WebGPU) | Mobile Safari WebGPU | Battery Saver → Balanced |
| No WebGPU | Legacy browsers | Fall back to `/` Live Experience |

## Quality tiers

| Tier | Res scale | MSAA | Particles | Shadows | SSAO | SSR | TAA | Bloom | Volumetrics | DoF / MB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Ultra** | 1.0 | 4× / temporal | 250k | contact + anal. | on | on | on | HQ | on | on |
| **High** | 1.0 | 2× / temporal | 120k | contact | on | half-res | on | on | half-res | on |
| **Balanced** | 0.85 | none / TAA | 48k | contact soft | half-res | off | on | on | off | DoF only |
| **Battery Saver** | 0.65 | none | 12k | off | off | off | off | soft | off | off |

## Frame budgets (GPU-bound)

| Tier | Target frame time | 1% low | Notes |
| --- | --- | --- | --- |
| Ultra | ≤ 8.3 ms (120 Hz) or ≤ 16.7 ms | ≥ 45 fps | Desktop only |
| High | ≤ 16.7 ms | ≥ 50 fps | |
| Balanced | ≤ 16.7 ms | ≥ 40 fps | Default |
| Battery Saver | ≤ 33 ms | ≥ 24 fps | Thermal / battery first |

## Draw-call / bandwidth

- Prefer **instanced** procedural draws; budget **≤ 40** draws (Balanced), **≤ 80** (Ultra).
- Magnitude field uploads: ≤ 64² float plane per snapshot unless Ultra.
- Asset decode only on workers; main/OffscreenCanvas never parses glTF.

## Instrumentation

`Profiling` subsystem exposes:

- CPU frame, GPU pass timers (timestamp queries when available)
- Snapshot lag (ms from `published_at` to apply)
- Dropped stale snapshot count
- Resident buffer/texture bytes (debug)

Benchmark suite: `packages/psyfi-gpu-renderer/benchmarks` (node + optional browser harness).
