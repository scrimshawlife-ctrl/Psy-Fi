import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import { G4_VISUAL_SEEDS } from '../contracts/g4Parity'
import { histogramL1, metricsFromFrame } from './pixelMetrics'
import { softPresentSnapshot, PIXEL_GOLDEN_SIZE } from './softPresent'
import { capturePixelFrame } from './webgpuCapture'
import type { PixelGoldenCase } from './pixelTypes'

const here = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(here, '../../fixtures/pixel-goldens')
const goldenPath = join(fixturesDir, 'g4_pixel_goldens.v1.json')

function loadSnapshot(file: string): SceneSnapshotV1 {
  return JSON.parse(readFileSync(join(fixturesDir, file), 'utf8')) as SceneSnapshotV1
}

describe('WebGPU / soft-present pixel goldens', () => {
  it('matches locked SHA + histogram for G4 seeds', () => {
    const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as {
      cases: { key: string; file: string; substance: string; mode: string; seed: number; intensity: number }[]
    }

    const cases: PixelGoldenCase[] = index.cases.map((c) => {
      const snap = loadSnapshot(c.file)
      const frame = softPresentSnapshot(snap, PIXEL_GOLDEN_SIZE)
      expect(frame.backend).toBe('soft')
      expect(frame.rgba.length).toBe(PIXEL_GOLDEN_SIZE * PIXEL_GOLDEN_SIZE * 4)
      return {
        key: c.key,
        substance: c.substance,
        mode: c.mode,
        seed: c.seed,
        intensity: c.intensity,
        metrics: metricsFromFrame(frame),
      }
    })

    expect(cases.map((c) => c.key)).toEqual(
      G4_VISUAL_SEEDS.map((s) => `${s.substance}_${s.mode}_${s.seed}`),
    )

    const shaSet = new Set(cases.map((c) => c.metrics.sha256))
    expect(shaSet.size).toBe(cases.length)

    if (process.env.PSYFI_UPDATE_PIXEL_GOLDENS === '1') {
      const payload = {
        schema: 'psyfi.g4_pixel_goldens.v1',
        size: PIXEL_GOLDEN_SIZE,
        backend: 'soft',
        note: 'Deterministic soft-present of scene-snapshot (CI). Hardware WebGPU capture optional via capturePixelFrame({ tryWebGpu: true, preferSoft: false }).',
        cases,
      }
      writeFileSync(goldenPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
    }

    const locked = JSON.parse(readFileSync(goldenPath, 'utf8')) as {
      schema: string
      size: number
      cases: PixelGoldenCase[]
    }
    expect(locked.schema).toBe('psyfi.g4_pixel_goldens.v1')
    expect(locked.size).toBe(PIXEL_GOLDEN_SIZE)
    expect(locked.cases).toHaveLength(cases.length)

    for (let i = 0; i < cases.length; i++) {
      const got = cases[i]
      const exp = locked.cases[i]
      expect(got.key).toBe(exp.key)
      expect(got.metrics.sha256, got.key).toBe(exp.metrics.sha256)
      expect(histogramL1(got.metrics.histogram, exp.metrics.histogram), got.key).toBe(0)
      expect(got.metrics.meanRgb[0]).toBeCloseTo(exp.metrics.meanRgb[0], 5)
    }
  })

  it('capturePixelFrame defaults to soft in Node', async () => {
    const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as {
      cases: { file: string }[]
    }
    const snap = loadSnapshot(index.cases[0].file)
    const frame = await capturePixelFrame(snap, { preferSoft: true })
    expect(frame.backend).toBe('soft')
    expect(frame.width).toBe(PIXEL_GOLDEN_SIZE)
  })

  it('neutral_view soft-present differs from open view', () => {
    const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as {
      cases: { file: string }[]
    }
    const snap = loadSnapshot(index.cases[0].file)
    const open = softPresentSnapshot(snap)
    const neutral = softPresentSnapshot({
      ...snap,
      parameter_field: { ...snap.parameter_field, neutral_view: true },
    })
    expect(metricsFromFrame(open).sha256).not.toBe(metricsFromFrame(neutral).sha256)
  })
})
