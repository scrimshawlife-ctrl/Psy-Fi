import { describe, expect, it } from 'vitest'
import { FrameProfiler } from './FrameProfiler'
import { tierConfig } from '../contracts/QualityTier'
import { enabledPasses } from '../contracts/RenderGraph'
import type { DeviceCaps } from '../contracts/QualityTier'

const caps: DeviceCaps = {
  webgpu: true,
  maxTextureSize: 8192,
  preferBattery: false,
  isMobile: false,
  preferUltra: true,
  isNvidia: true,
  isDiscrete: true,
  adapter: {
    vendor: 'nvidia',
    description: 'NVIDIA GeForce RTX 5060',
    device: '',
    architecture: '',
    isDiscrete: true,
    isNvidia: true,
    isAmd: false,
    isIntel: false,
    isHighEndNvidia: true,
    isHighEndDiscrete: true,
    perfBand: 'ultra',
  },
}

describe('G3 production budget smoke', () => {
  it('ultra enables SSAO/SSR/DoF while battery keeps safety without SSR', () => {
    const ultra = enabledPasses('ultra', caps)
    const battery = enabledPasses('battery', caps)
    expect(ultra).toContain('post.ssao')
    expect(ultra).toContain('post.ssr')
    expect(ultra).toContain('post.dof')
    expect(ultra).toContain('post.motion_blur')
    expect(ultra).toContain('post.safety')
    expect(battery).toContain('post.safety')
    expect(battery).not.toContain('post.ssr')
    expect(battery).not.toContain('post.ssao')
    expect(battery).not.toContain('post.dof')
  })

  it('frame profiler averages stay under tier target when samples are healthy', () => {
    const profiler = new FrameProfiler()
    const target = tierConfig('balanced').targetFrameMs
    for (let i = 0; i < 30; i++) {
      profiler.push({ cpuMs: 12, snapshotLagMs: 2, droppedStale: 0, drawCalls: 20 })
    }
    expect(profiler.averageCpuMs()).toBeLessThan(target)
    expect(profiler.latest()?.drawCalls).toBe(20)
    const summary = profiler.summary(target)
    expect(summary.overBudget).toBe(false)
    expect(summary.fps).toBeGreaterThan(60)
    expect(summary.p95CpuMs).toBeLessThanOrEqual(target)
  })
})
