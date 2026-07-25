import { describe, expect, it } from 'vitest'
import { enabledPasses } from '../src/contracts/RenderGraph'
import { tierConfig, type DeviceCaps } from '../src/contracts/QualityTier'

const caps: DeviceCaps = {
  webgpu: true,
  maxTextureSize: 8192,
  preferBattery: false,
  isMobile: false,
  preferUltra: false,
  isNvidia: false,
  isDiscrete: false,
  adapter: {
    vendor: 'unknown',
    description: '',
    device: '',
    architecture: '',
    isDiscrete: false,
    isNvidia: false,
    isHighEndNvidia: false,
  },
}

describe('render graph budgets', () => {
  it('battery enables fewer passes than ultra', () => {
    const battery = enabledPasses('battery', caps)
    const ultra = enabledPasses('ultra', caps)
    expect(battery.length).toBeLessThan(ultra.length)
    expect(battery).toContain('post.safety')
    expect(ultra).toContain('post.ssr')
    expect(battery).not.toContain('post.ssr')
    expect(battery).not.toContain('compute.flow')
    expect(ultra).toContain('compute.flow')
    expect(ultra).toContain('compute.particles')
  })

  it('tier particle budgets are monotonic', () => {
    expect(tierConfig('battery').particleBudget).toBeLessThan(tierConfig('balanced').particleBudget)
    expect(tierConfig('balanced').particleBudget).toBeLessThan(tierConfig('high').particleBudget)
    expect(tierConfig('high').particleBudget).toBeLessThan(tierConfig('ultra').particleBudget)
  })

  it('safety pass always enabled', () => {
    for (const tier of ['ultra', 'high', 'balanced', 'battery'] as const) {
      expect(enabledPasses(tier, caps)).toContain('post.safety')
    }
  })
})
