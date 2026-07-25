import { describe, expect, it } from 'vitest'
import { classifyAdapterInfo, isHighEndNvidiaDescription } from './GpuAdapter'

describe('GpuAdapter NVIDIA classification', () => {
  it('detects RTX 5060 as high-end NVIDIA discrete', () => {
    const info = classifyAdapterInfo({
      vendor: 'nvidia',
      description: 'NVIDIA GeForce RTX 5060',
    })
    expect(info.isNvidia).toBe(true)
    expect(info.isDiscrete).toBe(true)
    expect(info.isHighEndNvidia).toBe(true)
    expect(isHighEndNvidiaDescription('GeForce RTX 5060 Laptop GPU')).toBe(true)
  })

  it('detects RTX 4090 / 4060 class', () => {
    expect(isHighEndNvidiaDescription('NVIDIA GeForce RTX 4090')).toBe(true)
    expect(isHighEndNvidiaDescription('NVIDIA GeForce RTX 4060 Ti')).toBe(true)
  })

  it('does not mark Intel iGPU as NVIDIA high-end', () => {
    const info = classifyAdapterInfo({
      vendor: 'intel',
      description: 'Intel(R) UHD Graphics',
    })
    expect(info.isNvidia).toBe(false)
    expect(info.isHighEndNvidia).toBe(false)
  })
})
