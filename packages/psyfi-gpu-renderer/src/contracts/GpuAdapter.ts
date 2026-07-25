/**
 * WebGPU adapter probing for discrete desktops:
 * NVIDIA RTX 30/40/50, AMD RX 6000/7000/9000, Intel Arc (and peers).
 * Simulation stays Python-authoritative; the GPU path is browser WebGPU.
 */

export type GpuVendor = 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown'

/** Performance band used for default quality tier. */
export type GpuPerfBand = 'ultra' | 'high' | 'integrated' | 'unknown'

export interface GpuAdapterInfo {
  vendor: GpuVendor
  description: string
  device: string
  architecture: string
  isDiscrete: boolean
  isNvidia: boolean
  isAmd: boolean
  isIntel: boolean
  /** @deprecated use isHighEndDiscrete — kept for callers/tests */
  isHighEndNvidia: boolean
  /** RTX 30/40/50, RX 6000/7000/9000, Arc A770/B-series, etc. */
  isHighEndDiscrete: boolean
  perfBand: GpuPerfBand
}

const EMPTY: GpuAdapterInfo = {
  vendor: 'unknown',
  description: '',
  device: '',
  architecture: '',
  isDiscrete: false,
  isNvidia: false,
  isAmd: false,
  isIntel: false,
  isHighEndNvidia: false,
  isHighEndDiscrete: false,
  perfBand: 'unknown',
}

function classifyVendor(raw: string): GpuVendor {
  const s = raw.toLowerCase()
  if (s.includes('nvidia') || s.includes('geforce') || s.includes('quadro') || /\brtx\b/.test(s)) {
    return 'nvidia'
  }
  if (s.includes('amd') || s.includes('radeon') || s.includes('ati ')) return 'amd'
  if (s.includes('intel') || s.includes('arc')) return 'intel'
  if (s.includes('apple') || s.includes('metal') || /\bm[1-4]\b/.test(s)) return 'apple'
  return 'unknown'
}

/** NVIDIA GeForce RTX 30 / 40 / 50 (and close SKUs) → Ultra band. */
export function isNvidiaRtx3050Series(description: string): boolean {
  const s = description.toLowerCase()
  if (!/(nvidia|geforce|\brtx\b)/i.test(s)) return false
  // RTX 3xxx / 4xxx / 5xxx (desktop, Ti, Super, Laptop)
  if (/\brtx\s*(30|40|50)\d{2}\b/i.test(s)) return true
  if (/\brtx\s*(30|40|50)\s*series\b/i.test(s)) return true
  // Bare model tokens sometimes appear without "rtx"
  if (/\b(3060|3070|3080|3090|4060|4070|4080|4090|5060|5070|5080|5090)(\s*ti)?\b/i.test(s) && /geforce|nvidia/i.test(s)) {
    return true
  }
  return false
}

/** AMD Radeon RX 6000 / 7000 / 9000 ≈ NVIDIA 30 / 40 / 50 peers → Ultra band. */
export function isAmdRx6xxxPlus(description: string): boolean {
  const s = description.toLowerCase()
  if (!/(amd|radeon|\brx\b)/i.test(s)) return false
  // RX 6xxx, 7xxx, 9xxx (RDNA2/3/4)
  if (/\brx\s*(6|7|9)\d{3}\b/i.test(s)) return true
  if (/\bradeon\s+rx\s*(6|7|9)\d{3}\b/i.test(s)) return true
  // Common named SKUs
  if (/\b(6600|6650|6700|6750|6800|6850|6900|6950|7600|7700|7800|7900|9060|9070|9080|9090)\b/i.test(s) && /radeon|rx/i.test(s)) {
    return true
  }
  return false
}

/** Intel Arc discrete (Alchemist A7xx / Battlemage B-series) → Ultra band. */
export function isIntelArcDiscrete(description: string): boolean {
  const s = description.toLowerCase()
  if (!/intel|arc/.test(s)) return false
  if (/\barc\b/.test(s) && /\b(a750|a770|b570|b580|b60|b70|a580|a380)\b/i.test(s)) return true
  if (/\barc\s*(a|b)\d{3}\b/i.test(s)) return true
  if (/\bintel\(r\)\s*arc/i.test(s) && !/uhd|iris|graphics\s*6/i.test(s)) return true
  return false
}

/** Apple Silicon Pro/Max/Ultra — strong desktop-class for Ultra. */
export function isAppleHighEnd(description: string): boolean {
  const s = description.toLowerCase()
  return /apple/.test(s) && /\b(m1|m2|m3|m4)\b/.test(s) && /\b(pro|max|ultra)\b/.test(s)
}

/** Older discrete that still deserves High (not Ultra): RTX 20, GTX 16, RX 5000, etc. */
export function isMidDiscreteDescription(description: string): boolean {
  const s = description.toLowerCase()
  if (/\brtx\s*20\d{2}\b/i.test(s)) return true
  if (/\bgtx\s*16\d{2}\b/i.test(s)) return true
  if (/\brx\s*5\d{3}\b/i.test(s)) return true
  if (/\bquadro\b|\brtx\s*a\d{4}\b/i.test(s)) return true
  return false
}

export function isHighEndNvidiaDescription(description: string): boolean {
  return isNvidiaRtx3050Series(description)
}

export function classifyPerfBand(vendor: GpuVendor, description: string): GpuPerfBand {
  const blob = description
  if (
    isNvidiaRtx3050Series(blob) ||
    isAmdRx6xxxPlus(blob) ||
    isIntelArcDiscrete(blob) ||
    isAppleHighEnd(blob)
  ) {
    return 'ultra'
  }
  if (vendor === 'nvidia' || vendor === 'amd' || isMidDiscreteDescription(blob)) {
    return 'high'
  }
  if (vendor === 'intel' && /uhd|iris|graphics/.test(blob.toLowerCase()) && !/arc/.test(blob.toLowerCase())) {
    return 'integrated'
  }
  if (vendor === 'apple') return 'high'
  if (/discrete|dgpu|geforce|radeon\s+rx/i.test(blob)) return 'high'
  return 'unknown'
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
  const isAmd = vendor === 'amd'
  const isIntel = vendor === 'intel'
  const perfBand = classifyPerfBand(vendor, description || vendorStr)
  const isHighEndDiscrete = perfBand === 'ultra'
  const isDiscrete =
    isHighEndDiscrete ||
    isNvidia ||
    isAmd ||
    isIntelArcDiscrete(description) ||
    isMidDiscreteDescription(description) ||
    /discrete|dgpu|geforce|radeon\s+rx/i.test(description)

  return {
    vendor,
    description,
    device: String(raw.device || ''),
    architecture: String(raw.architecture || ''),
    isDiscrete,
    isNvidia,
    isAmd,
    isIntel,
    isHighEndNvidia: isNvidia && isNvidiaRtx3050Series(description || vendorStr),
    isHighEndDiscrete,
    perfBand,
  }
}

/**
 * Request the high-performance WebGPU adapter (discrete GPU when present).
 * Falls back to EMPTY when WebGPU is unavailable.
 */
export async function probeGpuAdapter(): Promise<GpuAdapterInfo> {
  const gpu = typeof navigator !== 'undefined' ? navigator.gpu : undefined
  if (!gpu?.requestAdapter) return EMPTY
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) return EMPTY

    const withInfo = adapter as GPUAdapter & {
      info?: { vendor?: string; architecture?: string; device?: string; description?: string }
      requestAdapterInfo?: () => Promise<{
        vendor?: string
        architecture?: string
        device?: string
        description?: string
      }>
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
