/**
 * WebGPU adapter probing for NVIDIA / discrete desktops (e.g. RTX 5060).
 * Simulation stays Python-authoritative; the GPU path is browser WebGPU.
 */

export type GpuVendor = 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown'

export interface GpuAdapterInfo {
  vendor: GpuVendor
  description: string
  device: string
  architecture: string
  isDiscrete: boolean
  isNvidia: boolean
  /** RTX 30/40/50-class (and similar high GeForce) — prefer Ultra. */
  isHighEndNvidia: boolean
}

const EMPTY: GpuAdapterInfo = {
  vendor: 'unknown',
  description: '',
  device: '',
  architecture: '',
  isDiscrete: false,
  isNvidia: false,
  isHighEndNvidia: false,
}

function classifyVendor(raw: string): GpuVendor {
  const s = raw.toLowerCase()
  if (s.includes('nvidia') || s.includes('geforce') || s.includes('quadro') || s.includes('rtx ')) return 'nvidia'
  if (s.includes('amd') || s.includes('radeon') || s.includes('ati ')) return 'amd'
  if (s.includes('intel')) return 'intel'
  if (s.includes('apple') || s.includes('metal')) return 'apple'
  return 'unknown'
}

/** True for modern discrete NVIDIA GeForce suitable for Ultra tier. */
export function isHighEndNvidiaDescription(description: string): boolean {
  const s = description.toLowerCase()
  if (!s.includes('nvidia') && !s.includes('geforce') && !s.includes('rtx')) return false
  // RTX 20/30/40/50 + common high SKUs; includes user 5060 class
  if (/rtx\s*(20|30|40|50)\d{2}/i.test(s)) return true
  if (/geforce\s*(rtx\s*)?(3060|3070|3080|3090|4060|4070|4080|4090|5060|5070|5080|5090)/i.test(s)) return true
  if (/rtx\s*50/i.test(s)) return true
  return false
}

export function classifyAdapterInfo(raw: {
  vendor?: string
  description?: string
  device?: string
  architecture?: string
}): GpuAdapterInfo {
  const description = String(raw.description || raw.device || raw.vendor || '')
  const vendorStr = `${raw.vendor || ''} ${description}`
  const vendor = classifyVendor(vendorStr)
  const isNvidia = vendor === 'nvidia'
  const isDiscrete =
    isNvidia ||
    vendor === 'amd' ||
    /discrete|dgpu|geforce|radeon\s+rx/i.test(description)
  return {
    vendor,
    description,
    device: String(raw.device || ''),
    architecture: String(raw.architecture || ''),
    isDiscrete,
    isNvidia,
    isHighEndNvidia: isNvidia && isHighEndNvidiaDescription(description || vendorStr),
  }
}

/**
 * Request the high-performance WebGPU adapter (NVIDIA dGPU when present).
 * Falls back to EMPTY when WebGPU is unavailable.
 */
export async function probeGpuAdapter(): Promise<GpuAdapterInfo> {
  const gpu = typeof navigator !== 'undefined' ? navigator.gpu : undefined
  if (!gpu?.requestAdapter) return EMPTY
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) return EMPTY

    // Chromium: adapter.info; older: requestAdapterInfo()
    const withInfo = adapter as GPUAdapter & {
      info?: { vendor?: string; architecture?: string; device?: string; description?: string }
      requestAdapterInfo?: () => Promise<{ vendor?: string; architecture?: string; device?: string; description?: string }>
    }
    let raw: { vendor?: string; description?: string; device?: string; architecture?: string } = {}
    if (withInfo.info) {
      raw = withInfo.info
    } else if (typeof withInfo.requestAdapterInfo === 'function') {
      raw = await withInfo.requestAdapterInfo()
    }
    return classifyAdapterInfo(raw)
  } catch {
    return EMPTY
  }
}
