export type QualityTier = 'ultra' | 'high' | 'balanced' | 'battery'

export interface DeviceCaps {
  webgpu: boolean
  maxTextureSize: number
  preferBattery: boolean
  isMobile: boolean
}

export interface TierConfig {
  tier: QualityTier
  resolutionScale: number
  particleBudget: number
  maxDrawCalls: number
  targetFrameMs: number
  post: {
    taa: boolean
    ssao: boolean
    ssr: boolean
    bloom: boolean
    volumetricFog: boolean
    contactShadows: boolean
    motionBlur: boolean
    depthOfField: boolean
    chromaticAberration: boolean
    colorGrading: boolean
    hdr: boolean
  }
}

const TIERS: Record<QualityTier, TierConfig> = {
  ultra: {
    tier: 'ultra',
    resolutionScale: 1,
    particleBudget: 250_000,
    maxDrawCalls: 80,
    targetFrameMs: 8.3,
    post: {
      taa: true,
      ssao: true,
      ssr: true,
      bloom: true,
      volumetricFog: true,
      contactShadows: true,
      motionBlur: true,
      depthOfField: true,
      chromaticAberration: true,
      colorGrading: true,
      hdr: true,
    },
  },
  high: {
    tier: 'high',
    resolutionScale: 1,
    particleBudget: 120_000,
    maxDrawCalls: 60,
    targetFrameMs: 16.7,
    post: {
      taa: true,
      ssao: true,
      ssr: true,
      bloom: true,
      volumetricFog: true,
      contactShadows: true,
      motionBlur: false,
      depthOfField: true,
      chromaticAberration: true,
      colorGrading: true,
      hdr: true,
    },
  },
  balanced: {
    tier: 'balanced',
    resolutionScale: 0.85,
    particleBudget: 48_000,
    maxDrawCalls: 40,
    targetFrameMs: 16.7,
    post: {
      taa: true,
      ssao: true,
      ssr: false,
      bloom: true,
      volumetricFog: false,
      contactShadows: true,
      motionBlur: false,
      depthOfField: true,
      chromaticAberration: false,
      colorGrading: true,
      hdr: true,
    },
  },
  battery: {
    tier: 'battery',
    resolutionScale: 0.65,
    particleBudget: 12_000,
    maxDrawCalls: 24,
    targetFrameMs: 33,
    post: {
      taa: false,
      ssao: false,
      ssr: false,
      bloom: true,
      volumetricFog: false,
      contactShadows: false,
      motionBlur: false,
      depthOfField: false,
      chromaticAberration: false,
      colorGrading: true,
      hdr: false,
    },
  },
}

export function normalizeTier(raw: string | undefined | null): QualityTier {
  const t = (raw || 'balanced').toLowerCase().replace('battery_saver', 'battery')
  if (t === 'ultra' || t === 'high' || t === 'balanced' || t === 'battery') return t
  return 'balanced'
}

export function tierConfig(tier: QualityTier): TierConfig {
  return TIERS[tier]
}

/** Clamp requested tier downward based on device capabilities. */
export function resolveTier(requested: QualityTier, caps: DeviceCaps): QualityTier {
  if (!caps.webgpu) return 'battery'
  if (caps.preferBattery || caps.isMobile) {
    if (requested === 'ultra' || requested === 'high') return 'balanced'
  }
  return requested
}

export function probeDeviceCaps(): DeviceCaps {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  const isMobile = !!nav && /Mobi|Android|iPhone|iPad/i.test(nav.userAgent || '')
  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator
  const conn = nav ? (nav as Navigator & { connection?: { saveData?: boolean } }).connection : undefined
  const preferBattery = isMobile || !!conn?.saveData
  return {
    webgpu,
    maxTextureSize: 8192,
    preferBattery,
    isMobile,
  }
}

/** Async battery probe — prefer Battery Saver when discharging below 25%. */
export async function refineBatteryCaps(caps: DeviceCaps): Promise<DeviceCaps> {
  const getBattery = (navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean; level: number }> }).getBattery
  if (typeof getBattery !== 'function') return caps
  try {
    const bat = await getBattery.call(navigator)
    if (!bat.charging && bat.level > 0 && bat.level < 0.25) {
      return { ...caps, preferBattery: true }
    }
  } catch {
    /* ignore */
  }
  return caps
}
