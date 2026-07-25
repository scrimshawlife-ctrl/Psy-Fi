/**
 * Hardware Ultra fps capture helpers — match adapter → QA target, compute stats,
 * build downloadable measured sample payloads for DESKTOP_GPU validation.
 */

import { ULTRA_QA_TARGETS, type UltraQaTarget } from './ultraTargets'
import type { UltraFpsSample } from './ultraFpsMatrix'
import { evaluateFpsSample } from './ultraFpsMatrix'
import type { QualityTier } from '../contracts/QualityTier'

export const ULTRA_FPS_SAMPLE_SCHEMA = 'psyfi.ultra_fps_sample.v1' as const
export const DEFAULT_MEASURE_WARMUP_FRAMES = 60
export const DEFAULT_MEASURE_SAMPLE_FRAMES = 180

export interface FpsFromFrames {
  avgFps: number
  low1pctFps: number
  p95Ms: number
  sampleCount: number
}

export interface MeasuredUltraFpsPayload {
  schema: typeof ULTRA_FPS_SAMPLE_SCHEMA
  date: string
  adapter: {
    description: string
    vendor: string
    perfBand: string
  }
  tier: QualityTier
  matched_target_id: string | null
  sample: UltraFpsSample
  evaluation: {
    ok: boolean
    targetFps: number
    targetFrameMs: number
    detail: string
  }
  note: string
}

function percentileSorted(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return 0
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  )
  return sortedAsc[idx]
}

/** Derive avg / 1% low fps and p95 frame time from wall-clock frame ms samples. */
export function computeFpsFromFrameMs(frameMs: number[]): FpsFromFrames {
  const clean = frameMs.filter((ms) => Number.isFinite(ms) && ms > 0)
  if (!clean.length) {
    return { avgFps: 0, low1pctFps: 0, p95Ms: 0, sampleCount: 0 }
  }
  const avgMs = clean.reduce((a, b) => a + b, 0) / clean.length
  const sortedMs = [...clean].sort((a, b) => a - b)
  const p95Ms = percentileSorted(sortedMs, 95)
  const fpsList = clean.map((ms) => 1000 / ms).sort((a, b) => a - b)
  // 1% low ≈ 1st percentile of instantaneous fps.
  const low1pctFps = percentileSorted(fpsList, 1)
  return {
    avgFps: Number((1000 / avgMs).toFixed(2)),
    low1pctFps: Number(low1pctFps.toFixed(2)),
    p95Ms: Number(p95Ms.toFixed(2)),
    sampleCount: clean.length,
  }
}

function normalizeAdapter(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Best-effort match of a WebGPU adapter description to an ULTRA_QA_TARGETS id.
 * Prefer an explicit `measure_id` override when the string is ambiguous.
 */
export function matchUltraQaTarget(
  adapterDescription: string,
  targets: UltraQaTarget[] = ULTRA_QA_TARGETS,
): UltraQaTarget | null {
  const desc = normalizeAdapter(adapterDescription)
  if (!desc) return null
  let best: { target: UltraQaTarget; score: number } | null = null
  for (const t of targets) {
    const needle = normalizeAdapter(t.description)
    let score = 0
    if (desc === needle) score = 100
    else if (desc.includes(needle) || needle.includes(desc)) score = 80
    else {
      // Token overlap on model numbers / series names.
      const tokens = needle.split(' ').filter((w) => w.length >= 3)
      const hits = tokens.filter((tok) => desc.includes(tok)).length
      score = hits * 10
      // Boost when SKU digits match (e.g. 4070, 7800, a770).
      const sku = needle.match(/\b([ab]?\d{3,4})\b/)
      if (sku && desc.includes(sku[1])) score += 25
    }
    if (!best || score > best.score) best = { target: t, score }
  }
  return best && best.score >= 25 ? best.target : null
}

export function resolveMeasureTargetId(
  adapterDescription: string,
  overrideId?: string | null,
): { id: string | null; target: UltraQaTarget | null } {
  if (overrideId) {
    const hit = ULTRA_QA_TARGETS.find((t) => t.id === overrideId) || null
    return { id: hit?.id ?? overrideId, target: hit }
  }
  const matched = matchUltraQaTarget(adapterDescription)
  return { id: matched?.id ?? null, target: matched }
}

export function buildMeasuredUltraFpsPayload(opts: {
  frameMs: number[]
  adapterDescription: string
  vendor?: string
  perfBand?: string
  tier: QualityTier
  measureId?: string | null
  date?: string
  warmupFrames?: number
}): MeasuredUltraFpsPayload {
  const warmup = opts.warmupFrames ?? DEFAULT_MEASURE_WARMUP_FRAMES
  const useful = opts.frameMs.slice(Math.max(0, warmup))
  const stats = computeFpsFromFrameMs(useful.length ? useful : opts.frameMs)
  const { id, target } = resolveMeasureTargetId(opts.adapterDescription, opts.measureId)
  const sampleId = id || 'unknown-adapter'
  const sample: UltraFpsSample = {
    id: sampleId,
    avgFps: stats.avgFps,
    low1pctFps: stats.low1pctFps,
    p95Ms: stats.p95Ms,
    source: 'measured',
    note: `Measured on ${opts.adapterDescription || 'unknown adapter'} · n=${stats.sampleCount}`,
  }
  const tier = target?.expectTier ?? opts.tier
  const evaluation = evaluateFpsSample(sample, tier)
  return {
    schema: ULTRA_FPS_SAMPLE_SCHEMA,
    date: opts.date ?? new Date().toISOString().slice(0, 10),
    adapter: {
      description: opts.adapterDescription || '',
      vendor: opts.vendor || 'unknown',
      perfBand: opts.perfBand || 'unknown',
    },
    tier,
    matched_target_id: id,
    sample,
    evaluation: {
      ok: evaluation.ok,
      targetFps: evaluation.targetFps,
      targetFrameMs: evaluation.targetFrameMs,
      detail: evaluation.detail,
    },
    note:
      'Paste into fixtures via scripts/merge_ultra_fps_measured.py. ' +
      'Modeled phenomenology for research/visualization only — not medical advice.',
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
