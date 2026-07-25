/**
 * Hardware Ultra fps matrix — synthetic stand-in until physical desktops measure.
 * Targets match ULTRA_QA_TARGETS; budgets come from QualityTier.targetFrameMs.
 */

import { tierConfig, type QualityTier } from '../contracts/QualityTier'
import { ULTRA_QA_TARGETS, type UltraQaTarget } from './ultraTargets'

export type FpsMatrixMode = 'synthetic' | 'measured'

export interface UltraFpsSample {
  id: string
  /** Average fps over the sample window. */
  avgFps: number
  /** 1% low fps (or synthetic proxy). */
  low1pctFps: number
  /** Frame-time p95 in ms. */
  p95Ms: number
  source: FpsMatrixMode
  note?: string
}

export interface UltraFpsRow {
  id: string
  vendor: string
  description: string
  expectTier: QualityTier
  targetFps: number
  targetFrameMs: number
  sample: UltraFpsSample
  ok: boolean
  detail: string
}

export interface UltraFpsMatrixReport {
  schema: 'psyfi.ultra_fps_matrix.v1'
  mode: FpsMatrixMode
  date: string
  rows: UltraFpsRow[]
  summary: { total: number; passed: number; failed: number; pending_hardware: number }
}

/** Target fps for a quality tier (1000 / targetFrameMs). */
export function targetFpsForTier(tier: QualityTier): number {
  const ms = tierConfig(tier).targetFrameMs
  return ms > 0 ? 1000 / ms : 0
}

/**
 * Synthetic samples for CI — all ULTRA_QA_TARGETS meet their tier budget with headroom.
 * Replace with measured samples when DESKTOP_GPU validation runs on silicon.
 */
export const SYNTHETIC_ULTRA_FPS_SAMPLES: UltraFpsSample[] = ULTRA_QA_TARGETS.map((t) => {
  const target = targetFpsForTier(t.expectTier)
  // Ultra ~120fps target → synthetic 132/118; High ~60 → 72/64
  const avgFps = t.expectTier === 'ultra' ? 132 : 72
  const low1pctFps = t.expectTier === 'ultra' ? 118 : 64
  const p95Ms = 1000 / low1pctFps
  return {
    id: t.id,
    avgFps,
    low1pctFps,
    p95Ms: Number(p95Ms.toFixed(2)),
    source: 'synthetic' as const,
    note: `CI stand-in vs ${target.toFixed(1)} fps tier target`,
  }
})

export function evaluateFpsSample(
  sample: UltraFpsSample,
  tier: QualityTier,
): { ok: boolean; detail: string; targetFps: number; targetFrameMs: number } {
  const targetFrameMs = tierConfig(tier).targetFrameMs
  const targetFps = targetFpsForTier(tier)
  // Require avg ≥ target and 1% low ≥ 90% of target (comfort floor).
  const lowFloor = targetFps * 0.9
  const avgOk = sample.avgFps + 1e-6 >= targetFps
  const lowOk = sample.low1pctFps + 1e-6 >= lowFloor
  const p95Ok = sample.p95Ms <= targetFrameMs * 1.15
  const ok = avgOk && lowOk && p95Ok
  return {
    ok,
    targetFps,
    targetFrameMs,
    detail: ok
      ? `avg=${sample.avgFps} low1%=${sample.low1pctFps} p95=${sample.p95Ms}ms ≤ target ${targetFps.toFixed(1)}fps / ${targetFrameMs}ms (${sample.source})`
      : `avg=${sample.avgFps} low1%=${sample.low1pctFps} p95=${sample.p95Ms}ms failed vs ${targetFps.toFixed(1)}fps / ${targetFrameMs}ms`,
  }
}

export function buildUltraFpsMatrix(opts?: {
  samples?: UltraFpsSample[]
  targets?: UltraQaTarget[]
  mode?: FpsMatrixMode
  date?: string
}): UltraFpsMatrixReport {
  const targets = opts?.targets ?? ULTRA_QA_TARGETS
  const samples = opts?.samples ?? SYNTHETIC_ULTRA_FPS_SAMPLES
  const byId = new Map(samples.map((s) => [s.id, s]))
  const mode = opts?.mode ?? (samples.every((s) => s.source === 'measured') ? 'measured' : 'synthetic')
  const rows: UltraFpsRow[] = targets.map((t) => {
    const sample = byId.get(t.id)
    if (!sample) {
      return {
        id: t.id,
        vendor: t.vendor,
        description: t.description,
        expectTier: t.expectTier,
        targetFps: targetFpsForTier(t.expectTier),
        targetFrameMs: tierConfig(t.expectTier).targetFrameMs,
        sample: {
          id: t.id,
          avgFps: 0,
          low1pctFps: 0,
          p95Ms: 999,
          source: 'synthetic',
          note: 'missing sample',
        },
        ok: false,
        detail: 'missing fps sample',
      }
    }
    const ev = evaluateFpsSample(sample, t.expectTier)
    return {
      id: t.id,
      vendor: t.vendor,
      description: t.description,
      expectTier: t.expectTier,
      targetFps: ev.targetFps,
      targetFrameMs: ev.targetFrameMs,
      sample,
      ok: ev.ok,
      detail: ev.detail,
    }
  })
  const passed = rows.filter((r) => r.ok).length
  const pending = rows.filter((r) => r.sample.source === 'synthetic').length
  return {
    schema: 'psyfi.ultra_fps_matrix.v1',
    mode,
    date: opts?.date ?? new Date().toISOString().slice(0, 10),
    rows,
    summary: {
      total: rows.length,
      passed,
      failed: rows.length - passed,
      pending_hardware: mode === 'synthetic' ? pending : 0,
    },
  }
}
