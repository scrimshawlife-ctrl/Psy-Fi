# Render Graph

## Topology (logical)

```mermaid
flowchart LR
  subgraph ingest
    Snap[SceneSnapshot store]
    Interp[Interpolator]
  end
  subgraph prep
    Cull[GPU cull]
    LOD[GPU LOD]
    Flow[Flow field compute]
    Part[Particle integrate]
  end
  subgraph gbuffer
    Depth[Depth / velocity]
    Opaque[Opaque PBR / crystal]
    Procedural[SDF / ribbons / metaballs]
  end
  subgraph lighting
    Shadows[Contact shadows]
    Deferred[Lighting + IBL]
    Vol[Volumetric fog]
  end
  subgraph post
    TAA[TAA / temporal accum]
    SSAO[SSAO]
    SSR[SSR]
    Bloom[Bloom]
    MB[Motion blur]
    DoF[Depth of field]
    CA[Chromatic aberration]
    Grade[Color grading]
    Exposure[PBE exposure]
    Safety[Safety clamp]
  end
  Snap --> Interp --> Cull --> LOD
  Flow --> Part --> Opaque
  Interp --> Procedural
  Cull --> Depth --> Opaque --> Shadows --> Deferred --> Vol
  Deferred --> TAA --> SSAO --> SSR --> Bloom --> MB --> DoF --> CA --> Grade --> Exposure --> Safety
  Safety --> Present[Swapchain / OffscreenCanvas]
```

## Node contract

Each graph node:

```ts
interface RenderPassNode {
  id: string
  reads: AttachmentId[]
  writes: AttachmentId[]
  enabled: (tier: QualityTier, caps: DeviceCaps) => boolean
  execute: (ctx: FrameContext) => void
}
```

Nodes are registered by subsystem factories (`PostProcessing`, `Lighting`, …) and assembled by `Renderer.createGraph(tier)`.

## Stale snapshot discard

```text
onSnapshot(s):
  if s.sequence <= store.appliedSequence: drop++
  else store.pending = s
onFrame(dt):
  if store.pending: beginInterp(store.pending); store.pending = null
  interpolate(dt)  // never await fetch
```

## Minimal draws

Opaque procedural instances → 1–N instanced draws after cull buffer compact. Particles → single indirect/instanced draw. Post → fullscreen triangles only.
