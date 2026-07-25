import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import { captureR3fStill, r3fStillHarnessAvailable } from './r3fStillCapture'

const here = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(here, '../../fixtures/pixel-goldens')

function loadSnapshot(): SceneSnapshotV1 {
  const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as {
    cases: { file: string }[]
  }
  return JSON.parse(readFileSync(join(fixturesDir, index.cases[0].file), 'utf8')) as SceneSnapshotV1
}

describe('R3F still capture orchestrator', () => {
  it('defaults to soft when preferSoft', async () => {
    const frame = await captureR3fStill(loadSnapshot(), { preferSoft: true })
    expect(frame.mode).toBe('soft')
    expect(frame.backend).toBe('soft')
    expect(frame.detail).toBe('preferSoft')
  })

  it('returns r3f-deferred without GPU CI harness', async () => {
    expect(r3fStillHarnessAvailable()).toBe(false)
    const frame = await captureR3fStill(loadSnapshot(), { preferSoft: false, requireGpuCi: true })
    expect(frame.mode).toBe('r3f-deferred')
    expect(frame.backend).toBe('soft')
    expect(frame.detail).toBe('gpu-ci-harness-required')
  })

  it('ships deferred stills fixture schema', () => {
    const path = join(fixturesDir, 'g4_r3f_stills.v1.json')
    const doc = JSON.parse(readFileSync(path, 'utf8')) as {
      schema: string
      status: string
      cases: unknown[]
    }
    expect(doc.schema).toBe('psyfi.g4_r3f_stills.v1')
    expect(doc.status).toBe('deferred')
    expect(doc.cases).toEqual([])
  })
})
