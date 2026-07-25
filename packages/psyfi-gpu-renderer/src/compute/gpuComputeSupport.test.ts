import { describe, expect, it } from 'vitest'
import { resolveComputeBackend, supportsGpuCompute } from './gpuComputeSupport'

describe('gpuComputeSupport', () => {
  it('rejects missing compute', () => {
    expect(supportsGpuCompute(null)).toBe(false)
    expect(supportsGpuCompute({})).toBe(false)
    expect(supportsGpuCompute({ isWebGPURenderer: true })).toBe(false)
  })

  it('accepts WebGPU renderer with compute', () => {
    const gl = { isWebGPURenderer: true, compute: () => undefined }
    expect(supportsGpuCompute(gl)).toBe(true)
    expect(resolveComputeBackend(gl)).toBe('webgpu')
  })

  it('accepts backend flag with computeAsync', () => {
    const gl = {
      backend: { isWebGPUBackend: true },
      computeAsync: async () => undefined,
    }
    expect(supportsGpuCompute(gl)).toBe(true)
  })

  it('resolveComputeBackend can force cpu', () => {
    const gl = { isWebGPURenderer: true, compute: () => undefined }
    expect(resolveComputeBackend(gl, false)).toBe('cpu')
  })
})
