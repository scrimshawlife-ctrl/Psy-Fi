export type ShaderBackend = 'webgpu' | 'webgl2' | 'compute'

export interface ShaderModuleDesc {
  id: string
  path: string
  backends: ShaderBackend[]
  qualityGates?: Array<'ultra' | 'high' | 'balanced' | 'battery'>
}

/** Logical registry — file payloads live under packages/psyfi-gpu-renderer/shaders/wgsl. */
export const SHADER_REGISTRY: ShaderModuleDesc[] = [
  { id: 'mat.pbr.standard', path: 'materials/pbr_standard.wgsl', backends: ['webgpu', 'webgl2'] },
  { id: 'mat.crystal.procedural', path: 'materials/crystal_procedural.wgsl', backends: ['webgpu', 'webgl2'] },
  { id: 'post.bloom', path: 'post/bloom.wgsl', backends: ['webgpu', 'webgl2'] },
  { id: 'post.taa', path: 'post/taa.wgsl', backends: ['webgpu'] },
  { id: 'post.ssao', path: 'post/ssao.wgsl', backends: ['webgpu'] },
  { id: 'post.ssr', path: 'post/ssr.wgsl', backends: ['webgpu'], qualityGates: ['ultra', 'high'] },
  { id: 'post.safety', path: 'post/safety_clamp.wgsl', backends: ['webgpu', 'webgl2'] },
  { id: 'comp.particles.integrate', path: 'compute/particles_integrate.wgsl', backends: ['compute', 'webgpu'] },
  { id: 'comp.flow.advect', path: 'compute/flow_advect.wgsl', backends: ['compute', 'webgpu'] },
  { id: 'comp.cull.instances', path: 'compute/instance_cull.wgsl', backends: ['compute', 'webgpu'] },
  { id: 'comp.lod.select', path: 'compute/lod_select.wgsl', backends: ['compute', 'webgpu'] },
]

export function getShader(id: string): ShaderModuleDesc | undefined {
  return SHADER_REGISTRY.find((s) => s.id === id)
}
