import { describe, expect, it } from 'vitest'
import {
  classifyAdapterInfo,
  isAmdRx6xxxPlus,
  isHighEndNvidiaDescription,
  isIntelArcDiscrete,
  isNvidiaRtx3050Series,
} from './GpuAdapter'

describe('GpuAdapter multi-vendor high-end classification', () => {
  it('NVIDIA RTX 30 / 40 / 50 series → ultra discrete', () => {
    for (const description of [
      'NVIDIA GeForce RTX 3060',
      'NVIDIA GeForce RTX 3080 Ti',
      'GeForce RTX 4070 SUPER',
      'NVIDIA GeForce RTX 4090',
      'NVIDIA GeForce RTX 5060',
      'GeForce RTX 5080 Laptop GPU',
      'NVIDIA GeForce RTX 3090',
    ]) {
      const info = classifyAdapterInfo({ vendor: 'nvidia', description })
      expect(info.isNvidia, description).toBe(true)
      expect(info.isHighEndDiscrete, description).toBe(true)
      expect(info.isHighEndNvidia, description).toBe(true)
      expect(info.perfBand, description).toBe('ultra')
      expect(isNvidiaRtx3050Series(description), description).toBe(true)
      expect(isHighEndNvidiaDescription(description), description).toBe(true)
    }
  })

  it('AMD RX 6000 / 7000 / 9000 peers → ultra discrete', () => {
    for (const description of [
      'AMD Radeon RX 6800 XT',
      'Radeon RX 7900 XTX',
      'AMD Radeon RX 7600',
      'AMD Radeon RX 9070 XT',
      'RX 6950 XT',
    ]) {
      const info = classifyAdapterInfo({ vendor: 'amd', description })
      expect(info.isAmd, description).toBe(true)
      expect(info.isHighEndDiscrete, description).toBe(true)
      expect(info.perfBand, description).toBe('ultra')
      expect(isAmdRx6xxxPlus(description), description).toBe(true)
    }
  })

  it('Intel Arc discrete → ultra band', () => {
    for (const description of [
      'Intel(R) Arc(TM) A770 Graphics',
      'Intel Arc B580',
      'Intel Arc A750',
    ]) {
      const info = classifyAdapterInfo({ vendor: 'intel', description })
      expect(info.isIntel, description).toBe(true)
      expect(info.isHighEndDiscrete, description).toBe(true)
      expect(info.perfBand, description).toBe('ultra')
      expect(isIntelArcDiscrete(description), description).toBe(true)
    }
  })

  it('Intel UHD iGPU is not high-end discrete', () => {
    const info = classifyAdapterInfo({
      vendor: 'intel',
      description: 'Intel(R) UHD Graphics 770',
    })
    expect(info.isHighEndDiscrete).toBe(false)
    expect(info.perfBand).toBe('integrated')
  })

  it('RTX 20-series is mid discrete (High band, not Ultra)', () => {
    const info = classifyAdapterInfo({
      vendor: 'nvidia',
      description: 'NVIDIA GeForce RTX 2080 Ti',
    })
    expect(info.isDiscrete).toBe(true)
    expect(info.isHighEndDiscrete).toBe(false)
    expect(info.perfBand).toBe('high')
  })

  it('Apple M-series Pro/Max → ultra', () => {
    const info = classifyAdapterInfo({
      vendor: 'apple',
      description: 'Apple M3 Max',
    })
    expect(info.perfBand).toBe('ultra')
    expect(info.isHighEndDiscrete).toBe(true)
  })
})
