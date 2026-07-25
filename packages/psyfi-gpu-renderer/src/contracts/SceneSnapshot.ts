import type { QualityTier } from './QualityTier'

/** Mirrors psyfi.scene_snapshot.v1 from Python — immutable on the client. */
export interface ParameterFieldV1 {
  schema_version?: string
  master_seed: number
  mode: string
  substance?: string
  experience_id?: string | null
  intensity: number
  phase?: string
  phase_t?: number
  neutral_view?: boolean
  quality_tier?: string
  parameters: Record<string, number>
  engines?: Record<string, number>
  palette?: Record<string, unknown>
  safety?: Record<string, number>
  hash: string
}

export interface MagnitudeField {
  width: number
  height: number
  values: number[][]
  normalized?: boolean
  encoding?: string
}

export interface ProceduralNode {
  id: string
  kind: string
  [key: string]: unknown
}

export interface SceneSnapshotV1 {
  schema_version: 'psyfi.scene_snapshot.v1' | string
  snapshot_id: string
  sequence: number
  published_at: string
  quality_tier: QualityTier | string
  parameter_field: ParameterFieldV1
  simulation?: Record<string, unknown> | null
  magnitude_field?: MagnitudeField | null
  procedural: {
    glyphs: ProceduralNode[]
    sdf_nodes: ProceduralNode[]
    ribbons: ProceduralNode[]
    metaballs: ProceduralNode[]
    volumetric_symbols: ProceduralNode[]
    crystals: ProceduralNode[]
  }
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    fov_deg: number
    exposure: number
    near: number
    far: number
  }
  lighting: Record<string, unknown>
  post: Record<string, boolean>
  safety?: Record<string, number>
  assets?: {
    gltf: unknown[]
    ktx2: unknown[]
    splats: unknown[]
  }
  authority?: Record<string, string | null | undefined>
  provenance_id?: string | null
  note?: string
  kind?: string
  substance?: string
  experience_id?: string | null
  timeline_hash?: string
}

export function assertSceneSnapshot(data: unknown): asserts data is SceneSnapshotV1 {
  if (!data || typeof data !== 'object') throw new Error('scene snapshot missing')
  const s = data as SceneSnapshotV1
  if (!s.schema_version || !String(s.schema_version).includes('scene_snapshot')) {
    throw new Error(`unexpected schema_version: ${s.schema_version}`)
  }
  if (typeof s.sequence !== 'number' || !s.parameter_field) {
    throw new Error('invalid scene snapshot shape')
  }
}
