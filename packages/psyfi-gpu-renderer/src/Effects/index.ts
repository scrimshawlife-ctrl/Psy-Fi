import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'

/** Domain FX derived only from snapshot parameters — no inference calls. */
export function effectWeights(snapshot: SceneSnapshotV1): Record<string, number> {
  const e = snapshot.parameter_field.engines || {}
  const p = snapshot.parameter_field.parameters || {}
  return {
    feedback: e.recursive_feedback ?? 0.3,
    kaleidoscope: e.kaleidoscope ?? 0.2,
    flow: e.flow_field ?? 0.2,
    bloom: p.bloom ?? 0.25,
    void: e.void_expansion ?? 0.15,
    lattice: e.entity_lattice ?? 0.1,
  }
}
