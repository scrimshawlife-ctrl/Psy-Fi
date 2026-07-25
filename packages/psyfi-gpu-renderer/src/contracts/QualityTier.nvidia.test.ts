import { describe, expect, it } from 'vitest'
import { recommendedTier, resolveTier, type DeviceCaps } from './QualityTier'

function nvidia5060(overrides: Partial<DeviceCaps> = {}): DeviceCaps {
  return {
    webgpu: true,
    maxTextureSize: 16384,
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
      isHighEndNvidia: true,
    },
    ...overrides,
  }
}

describe('NVIDIA tier guidance', () => {
  it('recommends Ultra for RTX 5060-class adapters', () => {
    expect(recommendedTier(nvidia5060())).toBe('ultra')
    expect(resolveTier('ultra', nvidia5060())).toBe('ultra')
  })

  it('still clamps Ultra when battery preference is on', () => {
    const caps = nvidia5060({ preferBattery: true, preferUltra: false })
    expect(resolveTier('ultra', caps)).toBe('balanced')
  })
})
