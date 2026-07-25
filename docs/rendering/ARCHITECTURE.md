# PsyFi GPU Rendering Architecture

Status: active design  
Related: [`WEB_ARCHITECTURE.md`](../WEB_ARCHITECTURE.md), [`FRONTEND_BOUNDARY.md`](../FRONTEND_BOUNDARY.md), schemas under `docs/schemas/`

## Intent

Replace the long-term visualization path with a **modular, GPU-first rendering platform** (React Three Fiber + Three.js `WebGPURenderer` + WGSL/TSL). The existing Canvas/WebGL Live Experience (`psyfi_api/static/viz/`) is **not patched**; it remains the compatibility shell until cutover gates pass.

## Non-negotiable invariants

1. **Simulation truth stays in Python** (`psyfi_core` + FastAPI `/api/v1`).
2. **Render and analysis are fully decoupled.** Camera / sensor acquisition never waits on symbolic analysis.
3. Analysis **publishes immutable scene snapshots**; the renderer **interpolates** toward the newest accepted snapshot and **discards stale** ones.
4. **Never stall the render loop** waiting on network, workers, or catalog builds.
5. **No rendering logic depends on symbolic inference.** Renderer accepts only immutable scene descriptions (`psyfi.scene_snapshot.v1`).
6. Safety / accessibility: Neutral View, reduce-motion, flash/luminance budgets remain enforceable at the post stack (and via snapshot `safety` fields from ParameterField).

## System context (integrated)

```text
┌──────────────────────────── Browser ─────────────────────────────┐
│  CameraPipeline (acquire)     Analysis bridge (async)            │
│       │ publish meters              │ fetch /api/v1/*            │
│       ▼                             ▼                            │
│  modulators (optional)     SceneSnapshotPublisher                │
│       │                     (immutable, sequenced)               │
│       └──────────► SnapshotStore (drop stale) ──► Interpolator   │
│                                              │                   │
│                                              ▼                   │
│  packages/psyfi-gpu-renderer                                     │
│    Renderer → RenderGraph → SceneGraph / Materials / Post / …    │
│    OffscreenCanvas + Worker asset loading                        │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS JSON (/api/v1)
┌───────────────────────────────▼──────────────────────────────────┐
│ FastAPI (psyfi_api)                                              │
│  /visualize/parameter-timeline · field-frame · scene-snapshot    │
│  experiences · substances · jobs · presets                       │
│  static /  (legacy shell)   ·   /gpu/ (built GPU dist, optional) │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│ psyfi_core — ABX, presets, phenomenology overlays, ParameterField│
└──────────────────────────────────────────────────────────────────┘
```

## Subsystem map (independently replaceable)

| Subsystem | Responsibility | Must not |
| --- | --- | --- |
| **Renderer** | WebGPU device, swapchain, frame loop, quality tier | Know substances / motifs |
| **SceneGraph** | Procedural nodes from snapshot | Fetch APIs |
| **ShaderLibrary** | WGSL/TSL modules | Own scene state |
| **MaterialSystem** | PBR + procedural material graphs | Hardcode phenomenology |
| **Lighting** | IBL, analytic lights, exposure | Mutate snapshot |
| **PostProcessing** | TAA, bloom, SSAO, SSR, DOF, … | Bypass safety clamps |
| **AssetPipeline** | glTF/Draco/KTX2/splat workers | Block frame loop |
| **CameraPipeline** | Capture + meters only | Run symbolic analysis |
| **Effects** | Domain FX driven by snapshot params | Call `/experiences` |
| **Profiling** | GPU/CPU timers, budgets | Alter visuals in prod |
| **DebugOverlay** | Pass viz, stats | Ship enabled by default |

## Immutable scene snapshot

Schema id: `psyfi.scene_snapshot.v1`  
Produced by `psyfi_core.visualization.scene_snapshot` and `POST /api/v1/visualize/scene-snapshot`.

Composes existing contracts:

- `PsyFiParameterField.v1` (engines, palette, safety, mode, intensity, seed)
- Optional `visualization.field` magnitude channel (row-major normalized)
- Procedural descriptors derived **deterministically** from field hash/seed (glyphs, SDF, ribbons, metaballs, volumes, crystals) — no texture-heavy narrative assets required
- Quality tier + enabled post flags
- `sequence` + `published_at` + `snapshot_id` for stale discard

## Decoupled loops

| Loop | Cadence | Failure mode |
| --- | --- | --- |
| Render | `requestAnimationFrame` / XR frame | Continues with last good interpolated state |
| Analysis publish | After `/api/v1` response | Drop if `sequence` ≤ current |
| Camera acquire | Device rate | Meters → modulators channel only; never blocks GPU |
| Asset load | Workers | Placeholders until ready; no hitch on main/OffscreenCanvas present |

## Quality tiers

`ultra` · `high` · `balanced` · `battery` — see [`GPU_PERFORMANCE_BUDGET.md`](GPU_PERFORMANCE_BUDGET.md). Snapshot may suggest a tier; client may clamp downward from capability probes (Apple Silicon / iPhone / desktop).

## Procedural scene graph

Everything symbolic is procedural geometry / SDF / volumes:

- vector glyph generation
- signed distance fields
- spline ribbons
- metaballs
- volumetric symbols
- procedural crystalline meshes

Instancing + GPU culling + LOD operate on these node types.

## Post stack (target)

HDR path → TAA → SSAO → SSR → contact shadows → volumetric fog → bloom → motion blur → DoF → chromatic aberration → color grading → physically based exposure → safety luminance/flash clamp (mandatory).

Pass enablement is quality-tier gated.

## Integration with current shell

| Surface | Role |
| --- | --- |
| `/` legacy shell | Workspace sim, Live Experience Canvas/WebGL, PWA |
| `/gpu/` | Optional GPU platform build (StaticFiles) |
| Shared API | Same `/api/v1`, tokens, provenance, soft-freeze pack |
| Bridge UX | Legacy “Bridge from sim” metadata remains; GPU client uses `scene-snapshot` |

## Security / privacy

Camera/MIDI remain opt-in. Snapshots must not embed raw camera frames. Telemetry stays disabled-by-default (`docs/TELEMETRY.md`).
