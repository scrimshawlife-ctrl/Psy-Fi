import { describe, expect, it } from 'vitest'
import { classifyAdapterInfo } from './GpuAdapter'
import { recommendedTier, resolveTier, type DeviceCaps } from './QualityTier'

function capsFromDescription(description: string, vendor?: string): DeviceCaps {
  const adapter = classifyAdapterInfo({ vendor, description })
  return {
    webgpu: true,
    maxTextureSize: adapter.isHighEndDiscrete ? 16384 : 8192,
    preferBattery: false,
    isMobile: false,
    preferUltra: adapter.isHighEndDiscrete,
    isNvidia: adapter.isNvidia,
    isDiscrete: adapter.isDiscrete,
    adapter,
  }
}

describe('multi-vendor recommended tiers', () => {
  it('Ultra for NVIDIA 30/40/50 and AMD/Intel peers', () => {
    expect(recommendedTier(capsFromDescription('NVIDIA GeForce RTX 3080'))).toBe('ultra')
    expect(recommendedTier(capsFromDescription('NVIDIA GeForce RTX 4070'))).toBe('ultra')
    expect(recommendedTier(capsFromDescription('NVIDIA GeForce RTX 5060'))).toBe('ultra')
    expect(recommendedTier(capsFromDescription('AMD Radeon RX 7800 XT', 'amd'))).toBe('ultra')
    expect(recommendedTier(capsFromDescription('AMD Radeon RX 9070 XT', 'amd'))).toBe('ultra')
    expect(recommendedTier(capsFromDescription('Intel Arc A770 Graphics', 'intel'))).toBe('ultra')
  })

  it('High for older discrete RTX 20', () => {
    expect(recommendedTier(capsFromDescription('NVIDIA GeForce RTX 2080'))).toBe('high')
  })

  it('still clamps Ultra when battery preference is on', () => {
    const caps = capsFromDescription('NVIDIA GeForce RTX 5060')
    caps.preferBattery = true
    caps.preferUltra = false
    expect(resolveTier('ultra', caps)).toBe('balanced')
  })
})
