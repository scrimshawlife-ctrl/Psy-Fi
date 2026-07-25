import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import {
  buildUltraQaReport,
  runAdapterUltraChecks,
  runBatteryClampCheck,
  runSoftPresentDistinctness,
  ULTRA_QA_TARGETS,
} from './simulateUltraQa'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/pixel-goldens')

describe('Simulated P0 Ultra desktop QA', () => {
  it('auto-selects Ultra for NVIDIA 30/40/50, AMD RX 6/7/9xxx, Intel Arc, Apple Pro/Max', () => {
    const results = runAdapterUltraChecks()
    const fails = results.filter((r) => !r.ok)
    expect(fails, JSON.stringify(fails, null, 2)).toEqual([])
    expect(results.length).toBe(ULTRA_QA_TARGETS.length)
  })

  it('clamps Ultra → Balanced when Battery Saver preference is on', () => {
    expect(runBatteryClampCheck().ok).toBe(true)
  })

  it('soft-present pixels stay distinct across G4 seeds (frame-comfort proxy)', () => {
    const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as {
      cases: { file: string }[]
    }
    const snaps = index.cases.map(
      (c) => JSON.parse(readFileSync(join(fixturesDir, c.file), 'utf8')) as SceneSnapshotV1,
    )
    const check = runSoftPresentDistinctness(snaps)
    expect(check.ok, check.detail).toBe(true)
  })

  it('builds an all-pass simulated QA report', () => {
    const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as {
      cases: { file: string }[]
    }
    const snaps = index.cases.map(
      (c) => JSON.parse(readFileSync(join(fixturesDir, c.file), 'utf8')) as SceneSnapshotV1,
    )
    const checks = [
      ...runAdapterUltraChecks(),
      runBatteryClampCheck(),
      runSoftPresentDistinctness(snaps),
    ]
    const report = buildUltraQaReport(checks)
    expect(report.mode).toBe('simulated')
    expect(report.summary.failed).toBe(0)
    expect(report.summary.passed).toBe(report.summary.total)
  })
})
