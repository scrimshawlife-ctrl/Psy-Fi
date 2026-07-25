# `@psyfi/gpu-renderer`

Modular **WebGPU-first** rendering platform for PsyFi (React Three Fiber + Three.js `WebGPURenderer`).

Does **not** modify `psyfi_api/static/viz/*`. Consumes immutable `psyfi.scene_snapshot.v1` documents from `/api/v1/visualize/scene-snapshot`.

## Subsystems

`Renderer` · `SceneGraph` · `ShaderLibrary` · `MaterialSystem` · `Lighting` · `PostProcessing` · `AssetPipeline` · `CameraPipeline` · `Effects` · `Profiling` · `DebugOverlay`

## Scripts

```bash
npm run dev        # Vite on :5173, proxies /api → :8000
npm run build      # dist/ served by FastAPI at /gpu/
npm run typecheck
npm test
npm run bench
```

## Docs

See [`docs/rendering/`](../../docs/rendering/).
