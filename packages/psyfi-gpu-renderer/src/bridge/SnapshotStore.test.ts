import { describe, expect, it } from 'vitest'
import { SnapshotStore } from './SnapshotStore'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'

function snap(sequence: number): SceneSnapshotV1 {
  return {
    schema_version: 'psyfi.scene_snapshot.v1',
    snapshot_id: `s${sequence}`,
    sequence,
    published_at: new Date().toISOString(),
    quality_tier: 'balanced',
    parameter_field: {
      master_seed: 1,
      mode: 'open',
      intensity: 0.5,
      parameters: {},
      hash: 'h',
    },
    procedural: {
      glyphs: [],
      sdf_nodes: [],
      ribbons: [],
      metaballs: [],
      volumetric_symbols: [],
      crystals: [],
    },
    camera: {
      position: [0, 0, 2],
      target: [0, 0, 0],
      fov_deg: 45,
      exposure: 1,
      near: 0.1,
      far: 100,
    },
    lighting: {},
    post: {},
  }
}

describe('SnapshotStore', () => {
  it('accepts newer sequences and drops stale', () => {
    const store = new SnapshotStore()
    expect(store.publish(snap(1))).toBe(true)
    expect(store.takePending()?.sequence).toBe(1)
    expect(store.publish(snap(1))).toBe(false)
    expect(store.publish(snap(3))).toBe(true)
    expect(store.publish(snap(2))).toBe(false)
    expect(store.stats().droppedStale).toBe(2)
    expect(store.takePending()?.sequence).toBe(3)
  })
})
