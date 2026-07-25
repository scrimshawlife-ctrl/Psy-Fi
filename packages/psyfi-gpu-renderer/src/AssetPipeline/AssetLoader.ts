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

export type AssetLoadMode = 'main' | 'worker'

/**
 * Asset loading with optional Worker offload (G2).
 * Never parse glTF/Draco/KTX2 on the render critical path — only fetch bytes here.
 */
export class AssetLoader {
  private cache = new Map<string, LoadedAsset>()
  private mode: AssetLoadMode = 'main'
  private worker: Worker | null = null

  constructor(opts?: { mode?: AssetLoadMode; workerUrl?: string }) {
    if (opts?.mode === 'worker' && typeof Worker !== 'undefined' && opts.workerUrl) {
      try {
        this.worker = new Worker(opts.workerUrl, { type: 'module' })
        this.mode = 'worker'
      } catch {
        this.mode = 'main'
        this.worker = null
      }
    }
  }

  get loadMode(): AssetLoadMode {
    return this.mode
  }

  async load(req: AssetRequest, signal?: AbortSignal): Promise<LoadedAsset> {
    const hit = this.cache.get(req.id)
    if (hit) return hit

    const asset =
      this.mode === 'worker' && this.worker
        ? await this.loadViaWorker(req, signal)
        : await this.loadMain(req, signal)

    this.cache.set(req.id, asset)
    return asset
  }

  private async loadMain(req: AssetRequest, signal?: AbortSignal): Promise<LoadedAsset> {
    const res = await fetch(req.url, { signal })
    if (!res.ok) throw new Error(`asset ${req.id}: ${res.status}`)
    const bytes = await res.arrayBuffer()
    return { id: req.id, kind: req.kind, bytes }
  }

  private loadViaWorker(req: AssetRequest, signal?: AbortSignal): Promise<LoadedAsset> {
    const worker = this.worker
    if (!worker) return this.loadMain(req, signal)
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        worker.postMessage({ type: 'abort', id: req.id })
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      const onMessage = (ev: MessageEvent) => {
        const data = ev.data as { type: string; id: string; bytes?: ArrayBuffer; error?: string }
        if (data.id !== req.id) return
        worker.removeEventListener('message', onMessage)
        signal?.removeEventListener('abort', onAbort)
        if (data.type === 'error') reject(new Error(data.error || 'worker asset error'))
        else resolve({ id: req.id, kind: req.kind, bytes: data.bytes as ArrayBuffer })
      }
      worker.addEventListener('message', onMessage)
      worker.postMessage({ type: 'load', id: req.id, url: req.url, kind: req.kind })
    })
  }

  clear(): void {
    this.cache.clear()
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    this.cache.clear()
  }
}

/** Pure helper used by asset workers and tests — fetch only, no decode. */
export async function fetchAssetBytes(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`asset fetch: ${res.status}`)
  return res.arrayBuffer()
}
