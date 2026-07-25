# Shader Organization

## Roots

```text
packages/psyfi-gpu-renderer/
  shaders/wgsl/
    materials/       # PBR, procedural crystal, SDF shade
    post/            # TAA, SSAO, SSR, bloom, DoF, grading, safety
    compute/         # particles, flow field, culling, LOD
    procedural/      # glyph, ribbon, metaball eval helpers
  src/ShaderLibrary/ # TS loaders + TSL graph wrappers
```

## Conventions

| Rule | Detail |
| --- | --- |
| Extension | `.wgsl` for hand-authored GPU modules; TSL JS for portable graphs |
| Entry names | `main_vs` / `main_fs` / `main` (compute) |
| Prefixes | `u_` uniforms, `s_` textures/samplers, `b_` storage buffers |
| Safety | Final composite **must** call `post/safety_clamp.wgsl` (or TSL equiv.) |
| No inference | Shaders consume only snapshot uniforms/buffers — no substance name branching in WGSL |

## Preferred authoring

1. **TSL** (`three/tsl`) for materials/post that need WebGPU↔WebGL fallback.
2. **Raw WGSL** for compute (particles, flow, cull/LOD) where TSL is insufficient.
3. Keep one **ShaderLibrary** registry: id → module + compatibility tags (`webgpu`, `webgl2`, `compute`).

## Naming examples

| Id | Path |
| --- | --- |
| `mat.pbr.standard` | `materials/pbr_standard.wgsl` |
| `mat.crystal.procedural` | `materials/crystal_procedural.wgsl` |
| `post.bloom` | `post/bloom.wgsl` |
| `post.taa` | `post/taa.wgsl` |
| `post.safety` | `post/safety_clamp.wgsl` |
| `comp.particles.integrate` | `compute/particles_integrate.wgsl` |
| `comp.flow.advect` | `compute/flow_advect.wgsl` |
| `comp.cull.instances` | `compute/instance_cull.wgsl` |

## Variant keys

Shader variants are keyed by `{shaderId, defines[], qualityTier}` and cached. Quality tier toggles define flags such as `USE_SSR`, `USE_SSAO_HALF`, `PARTICLE_BUDGET_L`.
