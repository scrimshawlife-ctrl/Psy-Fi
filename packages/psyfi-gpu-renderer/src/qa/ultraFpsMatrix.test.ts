import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ULTRA_QA_TARGETS } from './simulateUltraQa'
import {
  buildUltraFpsMatrix,
  evaluateFpsSample,
  SYNTHETIC_ULTRA_FPS_SAMPLES,
  targetFpsForTier,
} from './ultraFpsMatrix'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/qa')

describe('Hardware Ultra fps matrix', () => {
  it('Ultra target is ~120fps and High ~60fps', () => {
    expect(targetFpsForTier('ultra')).toBeCloseTo(1000 / 8.3, 1)
    expect(targetFpsForTier('high')).toBeCloseTo(1000 / 16.7, 1)
  })

  it('covers every ULTRA_QA_TARGETS id with a synthetic sample', () => {
    const ids = new Set(SYNTHETIC_ULTRA_FPS_SAMPLES.map((s) => s.id))
    for (const t of ULTRA_QA_TARGETS) expect(ids.has(t.id)).toBe(true)
  })

  it('synthetic matrix passes all rows', () => {
    const report = buildUltraFpsMatrix()
    expect(report.schema).toBe('psyfi.ultra_fps_matrix.v1')
    expect(report.mode).toBe('synthetic')
    expect(report.summary.failed).toBe(0)
    expect(report.summary.passed).toBe(ULTRA_QA_TARGETS.length)
    expect(report.summary.pending_hardware).toBe(ULTRA_QA_TARGETS.length)
  })

  it('fails when avg fps is below tier target', () => {
    const ev = evaluateFpsSample(
      { id: 'x', avgFps: 90, low1pctFps: 80, p95Ms: 12, source: 'synthetic' },
      'ultra',
    )
    expect(ev.ok).toBe(false)
  })

  it('ships fixture aligned with synthetic matrix', () => {
    const path = join(fixturesDir, 'ultra_fps_matrix.synthetic.v1.json')
    const doc = JSON.parse(readFileSync(path, 'utf8')) as {
      schema: string
      mode: string
      samples: { id: string; avgFps: number }[]
    }
    expect(doc.schema).toBe('psyfi.ultra_fps_matrix.v1')
    expect(doc.mode).toBe('synthetic')
    expect(doc.samples.length).toBe(ULTRA_QA_TARGETS.length)
    const report = buildUltraFpsMatrix({ samples: doc.samples as never })
    expect(report.summary.failed).toBe(0)
  })

  it('ships measured fixture scaffold (may be empty until hardware capture)', () => {
    const path = join(fixturesDir, 'ultra_fps_matrix.measured.v1.json')
    const doc = JSON.parse(readFileSync(path, 'utf8')) as {
      schema: string
      mode: string
      samples: { id: string; source: string; avgFps: number; low1pctFps: number; p95Ms: number }[]
    }
    expect(doc.schema).toBe('psyfi.ultra_fps_matrix.v1')
    expect(doc.mode).toBe('measured')
    for (const sample of doc.samples) {
      expect(sample.source).toBe('measured')
      const target = ULTRA_QA_TARGETS.find((t) => t.id === sample.id)
      expect(target).toBeTruthy()
      const ev = evaluateFpsSample(sample as never, target!.expectTier)
      expect(ev.ok).toBe(true)
    }
  })
})
