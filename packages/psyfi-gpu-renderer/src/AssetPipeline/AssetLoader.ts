import { createBasisTranscoder, type BasisTranscoder } from './basisTranscoder'
import { decodeAssetBytes, type AssetDecodeMeta, type DecodedAssetPayload } from './decodeAsset'
import { createDracoWasmDecoder, type DracoWasmDecoder } from './dracoBridge'
import { GpuAssetUploader, type GpuUploadDevice, type UploadedAsset } from './GpuAssetUploader'
import {
  planDracoMeshUpload,
  planKtx2UploadAsync,
  planLoadedAssetUpload,
  type GpuUploadPlan,
} from './uploadPlan'

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
  /** Present after G2 decode path (main or worker). */
  meta?: AssetDecodeMeta
}

export type AssetLoadMode = 'main' | 'worker'

export type { AssetDecodeMeta, DecodedAssetPayload }

/**
 * Asset loading with optional Worker offload (G2) + GPU upload planning (G4).
 * Fetch + lightweight decode stay off the render critical path.
 */
export class AssetLoader {
  private cache = new Map<string, LoadedAsset>()
  private mode: AssetLoadMode = 'main'
  private worker: Worker | null = null
  private loadSeq = 0
  private draco: DracoWasmDecoder
  private basis: BasisTranscoder

  constructor(opts?: {
    mode?: AssetLoadMode
    workerUrl?: string | URL
    /** Test/injection hook — bypasses Worker URL construction. */
    workerFactory?: () => Worker
    draco?: DracoWasmDecoder
    dracoWasmUrl?: string
    basis?: BasisTranscoder
  }) {
    this.draco = opts?.draco ?? createDracoWasmDecoder({ wasmUrl: opts?.dracoWasmUrl })
    this.basis = opts?.basis ?? createBasisTranscoder()
    if (opts?.mode === 'worker') {
      try {
        if (opts.workerFactory) {
          this.worker = opts.workerFactory()
          this.mode = 'worker'
        } else if (typeof Worker !== 'undefined') {
          const url =
            opts.workerUrl ??
            // Vite / bundler module worker
            new URL('./asset.worker.ts', import.meta.url)
          this.worker = new Worker(url, { type: 'module' })
          this.mode = 'worker'
        }
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
    const bytes = await fetchAssetBytes(req.url, signal)
    const meta = decodeAssetBytes(req.kind, bytes)
    return { id: req.id, kind: req.kind, bytes, meta }
  }

  private loadViaWorker(req: AssetRequest, signal?: AbortSignal): Promise<LoadedAsset> {
    const worker = this.worker
    if (!worker) return this.loadMain(req, signal)
    const seq = ++this.loadSeq
    return new Promise((resolve, reject) => {
      const onMessage = (ev: MessageEvent) => {
        const data = ev.data as {
          type: string
          id: string
          seq?: number
          kind?: AssetKind
          bytes?: ArrayBuffer
          meta?: AssetDecodeMeta
          error?: string
        }
        if (data.id !== req.id) return
        // Ignore stale generations for the same asset id.
        if (data.seq != null && data.seq !== seq) return
        cleanup()
        if (data.type === 'error') reject(new Error(data.error || 'worker asset error'))
        else {
          resolve({
            id: req.id,
            kind: req.kind,
            bytes: data.bytes as ArrayBuffer,
            meta: data.meta,
          })
        }
      }
      const onAbort = () => {
        cleanup()
        worker.postMessage({ type: 'abort', id: req.id, seq })
        reject(new DOMException('Aborted', 'AbortError'))
      }
      const cleanup = () => {
        worker.removeEventListener('message', onMessage)
        signal?.removeEventListener('abort', onAbort)
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      worker.addEventListener('message', onMessage)
      worker.postMessage({ type: 'load', id: req.id, url: req.url, kind: req.kind, seq })
    })
  }

  /** Pure plan from a loaded asset (KTX2 uncompressed → texture2d; else deferred). */
  planUpload(asset: LoadedAsset): GpuUploadPlan {
    return planLoadedAssetUpload(asset)
  }

  /** Decode Draco bitstream (PSYD test pack or configured WASM) → mesh upload plan. */
  planDracoUpload(id: string, bitstream: ArrayBuffer, attributes?: Record<string, number>) {
    return planDracoMeshUpload(id, bitstream, this.draco, attributes)
  }

  /** Load → plan → upload to WebGPU device (deferred plans returned without device writes). */
  async loadAndUpload(
    req: AssetRequest,
    device: GpuUploadDevice,
    signal?: AbortSignal,
  ): Promise<{ asset: LoadedAsset; plan: GpuUploadPlan; uploaded: UploadedAsset }> {
    const asset = await this.load(req, signal)
    const plan =
      asset.kind === 'ktx2'
        ? await planKtx2UploadAsync(asset.id, asset.bytes, this.basis)
        : this.planUpload(asset)
    const uploaded = new GpuAssetUploader(device).upload(plan)
    return { asset, plan, uploaded }
  }

  clear(): void {
    this.cache.clear()
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    this.draco.dispose()
    this.basis.dispose()
    this.cache.clear()
  }
}

/** Pure helper used by asset workers and tests — fetch only. */
export async function fetchAssetBytes(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`asset fetch: ${res.status}`)
  return res.arrayBuffer()
}
