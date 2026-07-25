import type { QualityTier, DeviceCaps, TierConfig } from './QualityTier'
import { tierConfig } from './QualityTier'

export type AttachmentId =
  | 'scene_color_hdr'
  | 'scene_depth'
  | 'velocity'
  | 'gbuffer_normal'
  | 'ssao'
  | 'ssr'
  | 'bloom'
  | 'post_color'
  | 'swapchain'

export interface FrameContext {
  dt: number
  time: number
  tier: TierConfig
  caps: DeviceCaps
  drawCalls: number
}

export interface RenderPassNode {
  id: string
  reads: AttachmentId[]
  writes: AttachmentId[]
  enabled: (tier: QualityTier, caps: DeviceCaps) => boolean
  /** Execute is intentionally side-effect free regarding analysis — GPU work only. */
  execute: (ctx: FrameContext) => void
}

/**
 * Logical pass graph. G2 compute kernels live in `src/compute/*` (CPU reference)
 * and `shaders/wgsl/compute/*` (WGSL). Scene wiring uses FlowParticleField;
 * execute hooks remain side-effect free for graph budgeting tests.
 */
export function buildDefaultRenderGraph(): RenderPassNode[] {
  return [
    {
      id: 'compute.flow',
      reads: [],
      writes: [],
      enabled: (t) => t !== 'battery',
      execute: () => {},
    },
    {
      id: 'compute.particles',
      reads: [],
      writes: [],
      enabled: (t) => t !== 'battery',
      execute: () => {},
    },
    {
      id: 'compute.cull',
      reads: [],
      writes: [],
      enabled: () => true,
      execute: () => {},
    },
    {
      id: 'compute.lod',
      reads: [],
      writes: [],
      enabled: (t) => t === 'ultra' || t === 'high' || t === 'balanced',
      execute: () => {},
    },
    {
      id: 'pass.opaque',
      reads: [],
      writes: ['scene_color_hdr', 'scene_depth', 'velocity', 'gbuffer_normal'],
      enabled: () => true,
      execute: () => {},
    },
    {
      id: 'pass.contact_shadows',
      reads: ['scene_depth'],
      writes: ['scene_color_hdr'],
      enabled: (t, _c) => tierConfig(t).post.contactShadows,
      execute: () => {},
    },
    {
      id: 'pass.volumetric_fog',
      reads: ['scene_depth', 'scene_color_hdr'],
      writes: ['scene_color_hdr'],
      enabled: (t) => tierConfig(t).post.volumetricFog,
      execute: () => {},
    },
    {
      id: 'post.taa',
      reads: ['scene_color_hdr', 'velocity'],
      writes: ['post_color'],
      enabled: (t) => tierConfig(t).post.taa,
      execute: () => {},
    },
    {
      id: 'post.ssao',
      reads: ['scene_depth', 'gbuffer_normal'],
      writes: ['ssao'],
      enabled: (t) => tierConfig(t).post.ssao,
      execute: () => {},
    },
    {
      id: 'post.ssr',
      reads: ['scene_color_hdr', 'scene_depth', 'gbuffer_normal'],
      writes: ['ssr'],
      enabled: (t) => tierConfig(t).post.ssr,
      execute: () => {},
    },
    {
      id: 'post.bloom',
      reads: ['post_color', 'scene_color_hdr'],
      writes: ['bloom'],
      enabled: (t) => tierConfig(t).post.bloom,
      execute: () => {},
    },
    {
      id: 'post.motion_blur',
      reads: ['post_color', 'velocity'],
      writes: ['post_color'],
      enabled: (t) => tierConfig(t).post.motionBlur,
      execute: () => {},
    },
    {
      id: 'post.dof',
      reads: ['post_color', 'scene_depth'],
      writes: ['post_color'],
      enabled: (t) => tierConfig(t).post.depthOfField,
      execute: () => {},
    },
    {
      id: 'post.chromatic_aberration',
      reads: ['post_color'],
      writes: ['post_color'],
      enabled: (t) => tierConfig(t).post.chromaticAberration,
      execute: () => {},
    },
    {
      id: 'post.color_grading',
      reads: ['post_color'],
      writes: ['post_color'],
      enabled: (t) => tierConfig(t).post.colorGrading,
      execute: () => {},
    },
    {
      id: 'post.exposure',
      reads: ['post_color'],
      writes: ['post_color'],
      enabled: (t) => tierConfig(t).post.hdr,
      execute: () => {},
    },
    {
      id: 'post.safety',
      reads: ['post_color'],
      writes: ['swapchain'],
      enabled: () => true,
      execute: () => {},
    },
  ]
}

export function enabledPasses(tier: QualityTier, caps: DeviceCaps): string[] {
  return buildDefaultRenderGraph()
    .filter((n) => n.enabled(tier, caps))
    .map((n) => n.id)
}
