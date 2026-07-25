/**
 * Read Live Experience → GPU Lab handoff from the URL query string.
 * Shell builds `/gpu/?substance=…&mode=…&intensity=…&seed=…&tier=…`.
 */

import { normalizeTier, type QualityTier } from '../contracts/QualityTier'

export interface GpuLaunchParams {
  substance?: string
  mode?: string
  intensity?: number
  seed?: number
  tier?: QualityTier
  experienceId?: string | null
  fromShell: boolean
  /** Opt-in SceneAssetLayer fixture KTX2 refs. */
  fixtureAssets: boolean
  /** Opt-in OffscreenCanvas present target (same-thread scaffold). */
  offscreen: boolean
  /** Prefer dedicated present-worker remoting (`?offscreen=worker`). */
  offscreenWorker: boolean
  /** Consume sessionStorage image-seed handoff from Live Experience. */
  imageSeed: boolean
  /** Auto-capture Ultra fps sample after warm-up (`?measure_fps=1`). */
  measureFps: boolean
  /** Optional ULTRA_QA_TARGETS id override for measure_fps matching. */
  measureId?: string | null
}

function truthyParam(q: URLSearchParams, key: string): boolean {
  const v = (q.get(key) || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export function readGpuLaunchParams(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): GpuLaunchParams {
  const q = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const substance = q.get('substance') || undefined
  const mode = q.get('mode') || undefined
  const experienceId = q.get('experience_id') || q.get('experienceId') || null
  const intensityRaw = q.get('intensity')
  const seedRaw = q.get('seed')
  const tierRaw = q.get('tier') || q.get('quality_tier') || q.get('quality')
  const intensity =
    intensityRaw != null && intensityRaw !== '' ? Number(intensityRaw) : undefined
  const seed = seedRaw != null && seedRaw !== '' ? Number(seedRaw) : undefined
  const fromShell = q.get('from') === 'shell' || !!(substance || tierRaw || experienceId)

  return {
    substance: substance || undefined,
    mode: mode || undefined,
    intensity: Number.isFinite(intensity as number) ? Math.min(1, Math.max(0, intensity as number)) : undefined,
    seed: Number.isFinite(seed as number) ? Math.floor(seed as number) : undefined,
    tier: tierRaw ? normalizeTier(tierRaw) : undefined,
    experienceId,
    fromShell,
    fixtureAssets: truthyParam(q, 'fixtures') || truthyParam(q, 'fixture_assets'),
    offscreen: truthyParam(q, 'offscreen') || (q.get('offscreen') || '').toLowerCase() === 'worker',
    offscreenWorker: (q.get('offscreen') || '').toLowerCase() === 'worker',
    imageSeed: truthyParam(q, 'image_seed'),
    measureFps: truthyParam(q, 'measure_fps'),
    measureId: q.get('measure_id') || q.get('measureId') || null,
  }
}

/** Build a `/gpu/` URL that carries the current Live Experience controls. */
export function buildGpuLabUrl(opts: {
  substance?: string
  mode?: string
  intensity?: number
  seed?: number
  qualityTier?: string
  experienceId?: string | null
  fixtureAssets?: boolean
  offscreen?: boolean
  imageSeed?: boolean
  measureFps?: boolean
  measureId?: string | null
  origin?: string
}): string {
  const q = new URLSearchParams()
  q.set('from', 'shell')
  if (opts.substance) q.set('substance', opts.substance)
  if (opts.mode) q.set('mode', opts.mode)
  if (opts.intensity != null && Number.isFinite(opts.intensity)) {
    q.set('intensity', String(opts.intensity))
  }
  if (opts.seed != null && Number.isFinite(opts.seed)) q.set('seed', String(Math.floor(opts.seed)))
  if (opts.qualityTier) q.set('tier', normalizeTier(opts.qualityTier))
  if (opts.experienceId) q.set('experience_id', opts.experienceId)
  if (opts.fixtureAssets) q.set('fixtures', '1')
  if (opts.offscreen) q.set('offscreen', '1')
  if (opts.imageSeed) q.set('image_seed', '1')
  if (opts.measureFps) q.set('measure_fps', '1')
  if (opts.measureId) q.set('measure_id', opts.measureId)
  const base = opts.origin != null ? `${opts.origin.replace(/\/$/, '')}/gpu/` : '/gpu/'
  return `${base}?${q.toString()}`
}
