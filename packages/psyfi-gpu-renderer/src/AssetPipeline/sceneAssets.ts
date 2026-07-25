/**
 * Normalize scene-snapshot asset refs and prepare GPU upload intents.
 * Python currently emits empty arrays; clients may attach { id, url } refs.
 */

import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { AssetKind } from './AssetLoader'
import { planLoadedAssetUpload, type GpuUploadPlan } from './uploadPlan'
import type { LoadedAsset } from './AssetLoader'

export interface SceneAssetRef {
  id: string
  url: string
  kind: AssetKind
  role?: string
}

export interface SceneAssetsNormalized {
  gltf: SceneAssetRef[]
  ktx2: SceneAssetRef[]
  splats: SceneAssetRef[]
  images: SceneAssetRef[]
  all: SceneAssetRef[]
}

function asRef(raw: unknown, kind: AssetKind, index: number): SceneAssetRef | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const url = typeof o.url === 'string' ? o.url : typeof o.href === 'string' ? o.href : ''
  if (!url) return null
  const id = typeof o.id === 'string' && o.id ? o.id : `${kind}-${index}`
  const role = typeof o.role === 'string' ? o.role : undefined
  return { id, url, kind, role }
}

export function normalizeSceneAssets(assets: SceneSnapshotV1['assets'] | undefined): SceneAssetsNormalized {
  const gltf = (assets?.gltf || []).map((r, i) => asRef(r, 'gltf', i)).filter(Boolean) as SceneAssetRef[]
  const ktx2 = (assets?.ktx2 || []).map((r, i) => asRef(r, 'ktx2', i)).filter(Boolean) as SceneAssetRef[]
  const splats = (assets?.splats || []).map((r, i) => asRef(r, 'splat', i)).filter(Boolean) as SceneAssetRef[]
  // Reuse ktx2 kind tag for ref shape; SceneAssetLayer special-cases PNG/data URLs.
  const images = (assets?.images || []).map((r, i) => asRef(r, 'ktx2', i)).filter(Boolean) as SceneAssetRef[]
  return { gltf, ktx2, splats, images, all: [...images, ...ktx2, ...gltf, ...splats] }
}

export function isPngOrDataUrl(url: string): boolean {
  const u = String(url || '').toLowerCase()
  return u.startsWith('data:image/') || u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.webp')
}

export interface SceneAssetUploadIntent {
  ref: SceneAssetRef
  plan: GpuUploadPlan
  ready: boolean
}

/** Build upload intents from already-loaded assets (testable without fetch). */
export function intentsFromLoaded(refs: SceneAssetRef[], loaded: LoadedAsset[]): SceneAssetUploadIntent[] {
  const byId = new Map(loaded.map((a) => [a.id, a]))
  return refs.map((ref) => {
    const asset = byId.get(ref.id)
    if (!asset) {
      return {
        ref,
        plan: {
          kind: 'deferred',
          id: ref.id,
          reason: 'not loaded',
          needs: 'unsupported',
        },
        ready: false,
      }
    }
    const plan = planLoadedAssetUpload(asset)
    return { ref, plan, ready: plan.kind !== 'deferred' }
  })
}

/** Extract mip0 RGBA bytes from a texture2d upload plan for Three.js DataTexture fallback. */
export function rgbaPreviewFromPlan(plan: GpuUploadPlan): {
  width: number
  height: number
  data: Uint8Array
} | null {
  if (plan.kind !== 'texture2d' || !plan.mips.length) return null
  const mip = plan.mips[0]
  return { width: mip.width, height: mip.height, data: mip.bytes }
}
