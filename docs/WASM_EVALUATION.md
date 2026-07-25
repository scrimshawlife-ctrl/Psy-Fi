# WASM Evaluation (Deferred)

Status: evaluated, **not adopted**  
Related: [`PLANS.md`](../PLANS.md), [`docs/PERFORMANCE_BUDGETS.md`](PERFORMANCE_BUDGETS.md)

## Decision

Do **not** introduce WebAssembly acceleration yet.

## Evidence so far

- Heatmap payloads are intentionally bounded (≤ 64×64 after downsample).
- Rasterization is already off the main thread via `render_worker.js`.
- Simulation authority remains in Python/`psyfi_core`; a WASM port would risk dual implementations without proven need.
- Current budgets prioritize cancellable server jobs and Worker/Canvas/WebGPU display paths.

## Revisit when

1. Profiling shows worker rasterize or client-side transforms exceed budgets on target devices, **and**
2. The hot path is stable (schema frozen), **and**
3. A parity harness exists against Python fixtures.

Until then, WASM remains an optional Priority 2 item without implementation.
