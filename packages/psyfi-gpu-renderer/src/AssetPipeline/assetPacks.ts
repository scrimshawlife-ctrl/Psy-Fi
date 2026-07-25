/**
 * Product art pack manifest helpers (mirror of psyfi_core.visualization.asset_packs).
 * CI ships empty/stub packs only — procedural scene remains authoritative.
 */

export const ASSET_PACK_SCHEMA = 'psyfi.asset_pack.v1' as const

export type AssetPackStatus = 'stub' | 'draft' | 'published'

export interface AssetPackRef {
  id: string
  url: string
  role?: string
}

export interface AssetPackManifest {
  schema: typeof ASSET_PACK_SCHEMA
  id: string
  version: string
  procedural_fallback: boolean
  license?: string
  status: AssetPackStatus
  gltf: AssetPackRef[]
  ktx2: AssetPackRef[]
  splats: AssetPackRef[]
}

function asRefs(raw: unknown): AssetPackRef[] {
  if (!Array.isArray(raw)) return []
  const out: AssetPackRef[] = []
  raw.forEach((row, i) => {
    if (!row || typeof row !== 'object') return
    const o = row as Record<string, unknown>
    const url = typeof o.url === 'string' ? o.url : typeof o.href === 'string' ? o.href : ''
    if (!url) return
    const id = typeof o.id === 'string' && o.id ? o.id : `ref-${i}`
    const role = typeof o.role === 'string' ? o.role : undefined
    out.push(role ? { id, url, role } : { id, url })
  })
  return out
}

export function normalizePackManifest(raw: unknown): AssetPackManifest | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.schema !== ASSET_PACK_SCHEMA) return null
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  if (!id) return null
  const status = o.status === 'draft' || o.status === 'published' || o.status === 'stub' ? o.status : 'stub'
  return {
    schema: ASSET_PACK_SCHEMA,
    id,
    version: typeof o.version === 'string' ? o.version : '0.0.0',
    procedural_fallback: o.procedural_fallback !== false,
    license: typeof o.license === 'string' ? o.license : undefined,
    status,
    gltf: asRefs(o.gltf),
    ktx2: asRefs(o.ktx2),
    splats: asRefs(o.splats),
  }
}

export function refsFromPack(pack: AssetPackManifest | null): AssetPackRef[] {
  if (!pack) return []
  return [...pack.ktx2, ...pack.gltf, ...pack.splats]
}

export interface SceneAssetBucket {
  gltf: AssetPackRef[]
  ktx2: AssetPackRef[]
  splats: AssetPackRef[]
}

/** Merge pack refs into snapshot assets (unknown/null pack → unchanged). */
export function attachPackAssets(
  assets: Partial<SceneAssetBucket> | null | undefined,
  pack: AssetPackManifest | null,
): SceneAssetBucket {
  const base: SceneAssetBucket = {
    gltf: [...(assets?.gltf || [])],
    ktx2: [...(assets?.ktx2 || [])],
    splats: [...(assets?.splats || [])],
  }
  if (!pack) return base
  for (const key of ['gltf', 'ktx2', 'splats'] as const) {
    const seen = new Set(base[key].map((r) => r.id))
    for (const row of pack[key]) {
      if (!seen.has(row.id)) {
        base[key].push({ ...row })
        seen.add(row.id)
      }
    }
  }
  return base
}
