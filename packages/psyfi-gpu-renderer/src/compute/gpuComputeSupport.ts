/** True when the R3F `gl` object can dispatch Three.js compute nodes. */
export function supportsGpuCompute(gl: unknown): boolean {
  if (!gl || typeof gl !== 'object') return false
  const r = gl as {
    isWebGPURenderer?: boolean
    backend?: { isWebGPUBackend?: boolean; name?: string }
    compute?: unknown
    computeAsync?: unknown
  }
  if (typeof r.compute !== 'function' && typeof r.computeAsync !== 'function') return false
  if (r.isWebGPURenderer) return true
  if (r.backend?.isWebGPUBackend) return true
  // Three may report backend name; require navigator.gpu as a final gate
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && typeof r.compute === 'function') {
    return true
  }
  return false
}

export type ComputeBackend = 'webgpu' | 'cpu'

export function resolveComputeBackend(gl: unknown, preferGpu = true): ComputeBackend {
  if (preferGpu && supportsGpuCompute(gl)) return 'webgpu'
  return 'cpu'
}
