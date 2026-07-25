export type AssetKind = 'gltf' | 'ktx2' | 'splat'

export interface AssetRequest {
  id: string
  kind: AssetKind
  url: string
}

export interface LoadedAsset {
  id: string
  kind: AssetKind
  bytes: ArrayBuffer
}

/**
 * Worker-based asset loading. Never parse glTF/Draco/KTX2 on the render critical path.
 * G0 provides the interface + main-thread stub; G2 attaches OffscreenCanvas workers.
 */
export class AssetLoader {
  private cache = new Map<string, LoadedAsset>()

  async load(req: AssetRequest, signal?: AbortSignal): Promise<LoadedAsset> {
    const hit = this.cache.get(req.id)
    if (hit) return hit
    const res = await fetch(req.url, { signal })
    if (!res.ok) throw new Error(`asset ${req.id}: ${res.status}`)
    const bytes = await res.arrayBuffer()
    const asset = { id: req.id, kind: req.kind, bytes }
    this.cache.set(req.id, asset)
    return asset
  }

  clear(): void {
    this.cache.clear()
  }
}
