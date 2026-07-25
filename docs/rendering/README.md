# PsyFi GPU Rendering Platform

Status: **G0–G3 ready** for Docker web ship; multi-vendor Ultra auto-tier live  
Does **not** patch `psyfi_api/static/viz/*` (legacy Canvas / WebGL Live Experience remains the production fallback).  
Next steps: [`../CONTINUATION_PLAN.md`](../CONTINUATION_PLAN.md) · desktop setup: [`../DESKTOP_GPU.md`](../DESKTOP_GPU.md).

## Documents

| Doc | Purpose |
| --- | --- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | GPU-first modular platform, decoupled analysis → render |
| [`ROADMAP.md`](ROADMAP.md) | Phased delivery of effects and subsystems |
| [`GPU_PERFORMANCE_BUDGET.md`](GPU_PERFORMANCE_BUDGET.md) | Ultra / High / Balanced / Battery Saver budgets |
| [`../DESKTOP_GPU.md`](../DESKTOP_GPU.md) | Multi-vendor WebGPU Ultra (NVIDIA / AMD / Intel / Apple) |
| [`G4_CUTOVER.md`](G4_CUTOVER.md) | Cutover parity checklist + asset GPU upload status |
| [`PIXEL_GOLDENS.md`](PIXEL_GOLDENS.md) | Soft-present / WebGPU pixel golden harness |
| [`SHADER_ORGANIZATION.md`](SHADER_ORGANIZATION.md) | WGSL / TSL layout and naming |
| [`ASSET_STANDARDS.md`](ASSET_STANDARDS.md) | glTF 2.0, Draco, KTX2, optional Gaussian Splats |
| [`RENDER_GRAPH.md`](RENDER_GRAPH.md) | Pass graph diagrams and replaceable nodes |
| [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) | Coexistence with FastAPI shell + cutover gates |
| [`XR_COMPATIBILITY.md`](XR_COMPATIBILITY.md) | Future WebXR / Apple Silicon / iPhone notes |

## Package

`packages/psyfi-gpu-renderer` — React Three Fiber + Three.js `WebGPURenderer`, modular subsystems.

## Infra integration

- **Authority:** Python `/api/v1` + `PsyFiParameterField` / visualization schemas stay source of truth.
- **Transport:** `POST /api/v1/visualize/scene-snapshot` publishes immutable scene snapshots (composes existing timeline / field-frame data).
- **Client:** GPU package maps snapshots → render graph; never calls symbolic inference.
- **Host:** FastAPI serves built assets at `/gpu/` when `packages/psyfi-gpu-renderer/dist` exists; legacy UI stays at `/`.
- **Fallback:** Unsupported WebGPU → quality downgrade / legacy Live Experience link.

## Quick start

```bash
# from repo root
npm install
npm run gpu:build
python3 scripts/run_dev_server.py
# → http://localhost:8000/       legacy shell
# → http://localhost:8000/gpu/   GPU platform (after build)
```

Dev HMR (API on :8000):

```bash
npm run gpu:dev
```
