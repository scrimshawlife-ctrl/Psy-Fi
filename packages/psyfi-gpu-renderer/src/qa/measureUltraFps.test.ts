import { describe, expect, it } from 'vitest'
import {
  buildMeasuredUltraFpsPayload,
  computeFpsFromFrameMs,
  matchUltraQaTarget,
  resolveMeasureTargetId,
} from './measureUltraFps'

describe('measureUltraFps', () => {
  it('computes avg / 1% low / p95 from frame ms', () => {
    const frames = Array.from({ length: 100 }, () => 8)
    frames[0] = 12
    frames[1] = 11
    const stats = computeFpsFromFrameMs(frames)
    expect(stats.sampleCount).toBe(100)
    expect(stats.avgFps).toBeGreaterThan(100)
    expect(stats.low1pctFps).toBeLessThanOrEqual(stats.avgFps)
    expect(stats.p95Ms).toBeGreaterThanOrEqual(8)
  })

  it('matches adapter strings to QA targets', () => {
    expect(matchUltraQaTarget('NVIDIA GeForce RTX 4070 SUPER')?.id).toBe('nvidia-rtx-4070')
    expect(matchUltraQaTarget('AMD Radeon RX 7800 XT')?.id).toBe('amd-rx-7800xt')
    expect(matchUltraQaTarget('Intel(R) Arc(TM) A770 Graphics')?.id).toBe('intel-arc-a770')
    expect(matchUltraQaTarget('Apple M3 Max')?.id).toBe('apple-m3-max')
  })

  it('honors measure_id override', () => {
    const r = resolveMeasureTargetId('Some Unknown GPU', 'nvidia-rtx-5060')
    expect(r.id).toBe('nvidia-rtx-5060')
    expect(r.target?.expectTier).toBe('ultra')
  })

  it('builds a measured sample payload that can pass Ultra budget', () => {
    const frames = Array.from({ length: 240 }, () => 7.2)
    const payload = buildMeasuredUltraFpsPayload({
      frameMs: frames,
      adapterDescription: 'NVIDIA GeForce RTX 5060',
      vendor: 'nvidia',
      perfBand: 'ultra',
      tier: 'ultra',
      warmupFrames: 60,
    })
    expect(payload.schema).toBe('psyfi.ultra_fps_sample.v1')
    expect(payload.sample.source).toBe('measured')
    expect(payload.matched_target_id).toBe('nvidia-rtx-5060')
    expect(payload.evaluation.ok).toBe(true)
  })
})
