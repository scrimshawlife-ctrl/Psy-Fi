/**
 * Basis Universal transcoder bridge for KTX2 BasisLZ payloads.
 * Vendored assets live under `/gpu/vendor/basis/` (see public/vendor/NOTICE.md).
 */

import { parseKtx2Container, sliceKtx2Level, type Ktx2Container } from './ktx2Parse'
import { VENDOR_BASIS_PATH } from './vendorPaths'

export interface BasisRgbaImage {
  width: number
  height: number
  /** Tight RGBA8 rows. */
  rgba: Uint8Array
}

export interface BasisTranscoder {
  readonly ready: boolean
  readonly kind: 'wasm' | 'stub'
  readonly transcoderPath: string
  ensureReady?: () => Promise<void>
  /**
   * Transcode a GPU-deferred KTX2 (BasisLZ) into RGBA8 mip 0.
   * Full mip chains can be added once packs ship; G4 needs a working path.
   */
  transcodeKtx2ToRgba8(bytes: ArrayBuffer): Promise<BasisRgbaImage>
  dispose(): void
}

export interface BasisTranscoderOptions {
  transcoderPath?: string
  impl?: BasisTranscoder
  mode?: 'auto' | 'stub' | 'wasm'
}

type BasisModule = {
  initializeBasis: () => void
  BasisFile: new (data: Uint8Array) => {
    getHasAlpha: () => boolean
    getNumImages: () => number
    getNumLevels: (imageIndex: number) => number
    getImageWidth: (imageIndex: number, levelIndex: number) => number
    getImageHeight: (imageIndex: number, levelIndex: number) => number
    startTranscoding: () => boolean
    getImageTranscodedSizeInBytes: (
      imageIndex: number,
      levelIndex: number,
      format: number,
    ) => number
    transcodeImage: (
      dst: Uint8Array,
      imageIndex: number,
      levelIndex: number,
      format: number,
      unused: number,
      unused2: number,
    ) => boolean
    close: () => void
    delete: () => void
  }
  // cTFRGBA32 = 13 in basis_universal
  transcoder_format_t?: { cTFRGBA32: number }
}

const CTRGBA32 = 13

export class StubBasisTranscoder implements BasisTranscoder {
  readonly ready = false
  readonly kind = 'stub' as const
  readonly transcoderPath: string

  constructor(transcoderPath = VENDOR_BASIS_PATH) {
    this.transcoderPath = transcoderPath
  }

  async transcodeKtx2ToRgba8(): Promise<BasisRgbaImage> {
    throw new Error('basis: transcoder not configured')
  }

  dispose(): void {
    /* no-op */
  }
}

/**
 * Loads vendored `basis_transcoder.js` + `.wasm`.
 * Works in Node (vitest) via filesystem locateFile and in the browser via `/gpu/vendor/basis/`.
 */
export class VendorBasisTranscoder implements BasisTranscoder {
  ready = false
  readonly kind = 'wasm' as const
  readonly transcoderPath: string
  private module: BasisModule | null = null
  private initPromise: Promise<void> | null = null

  constructor(transcoderPath = VENDOR_BASIS_PATH) {
    this.transcoderPath = transcoderPath.endsWith('/') ? transcoderPath : `${transcoderPath}/`
  }

  ensureReady = async (): Promise<void> => {
    if (this.ready && this.module) return
    if (!this.initPromise) {
      this.initPromise = this.loadModule()
    }
    await this.initPromise
  }

  private async loadModule(): Promise<void> {
    const path = this.transcoderPath
    // Node/vitest: Emscripten UMD does not export cleanly via createRequire from ESM.
    // Evaluate the factory with a CommonJS shim, then point locateFile at vendor WASM.
    if (typeof process !== 'undefined' && process.versions?.node) {
      const { readFileSync } = await import('node:fs')
      const { fileURLToPath } = await import('node:url')
      const { dirname, join } = await import('node:path')
      const { createRequire } = await import('node:module')
      const require = createRequire(import.meta.url)
      const here = dirname(fileURLToPath(import.meta.url))
      const vendorFs = join(here, '../../public/vendor/basis')
      const source = readFileSync(join(vendorFs, 'basis_transcoder.js'), 'utf8')
      const module = { exports: {} as { (cfg?: object): Promise<BasisModule> } }
      const factory = new Function(
        'module',
        'exports',
        'require',
        '__dirname',
        '__filename',
        `${source}\n;return module.exports;`,
      )(
        module,
        module.exports,
        require,
        vendorFs,
        join(vendorFs, 'basis_transcoder.js'),
      ) as (cfg?: object) => Promise<BasisModule>
      this.module = await factory({
        locateFile: (file: string) => join(vendorFs, file),
      })
      this.module.initializeBasis()
      this.ready = true
      return
    }

    // Browser: classic script + global BASIS factory (Emscripten UMD).
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `${path}basis_transcoder.js`
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`basis: failed to load ${script.src}`))
      document.head.appendChild(script)
    })
    const factory = (globalThis as unknown as { BASIS?: (cfg?: object) => Promise<BasisModule> }).BASIS
    if (!factory) throw new Error('basis: BASIS factory missing after script load')
    this.module = await factory({
      locateFile: (file: string) => `${path}${file}`,
    })
    this.module.initializeBasis()
    this.ready = true
  }

  async transcodeKtx2ToRgba8(bytes: ArrayBuffer): Promise<BasisRgbaImage> {
    await this.ensureReady()
    const module = this.module
    if (!module) throw new Error('basis: module missing')

    const container = parseKtx2Container(bytes)
    if (container.supercompression !== 'basislz') {
      throw new Error(`basis: expected basislz, got ${container.supercompression}`)
    }
    const level0 = container.levels[0]
    if (!level0) throw new Error('basis: missing level 0')
    // KTX2 BasisLZ stores a supercompressed payload; BasisFile accepts .basis-like bytes.
    // For Khronos KTX2 the level payload is the BasisLZ slice — pass it through.
    const payload = sliceKtx2Level(bytes, level0)
    return this.transcodeBasisPayload(payload, container)
  }

  /** Decode a raw .basis / BasisLZ payload to RGBA8 mip0. */
  async transcodeBasisPayload(payload: Uint8Array, hint?: Pick<Ktx2Container, 'width' | 'height'>): Promise<BasisRgbaImage> {
    await this.ensureReady()
    const module = this.module
    if (!module) throw new Error('basis: module missing')

    const file = new module.BasisFile(payload)
    try {
      if (!file.startTranscoding()) {
        throw new Error('basis: startTranscoding failed')
      }
      const width = file.getImageWidth(0, 0) || hint?.width || 0
      const height = file.getImageHeight(0, 0) || hint?.height || 0
      if (width <= 0 || height <= 0) throw new Error('basis: invalid image size')
      const format = module.transcoder_format_t?.cTFRGBA32 ?? CTRGBA32
      const dstSize = file.getImageTranscodedSizeInBytes(0, 0, format)
      const rgba = new Uint8Array(dstSize)
      if (!file.transcodeImage(rgba, 0, 0, format, 0, 0)) {
        throw new Error('basis: transcodeImage failed')
      }
      return { width, height, rgba }
    } finally {
      try {
        file.close()
      } catch {
        /* ignore */
      }
      try {
        file.delete()
      } catch {
        /* ignore */
      }
    }
  }

  dispose(): void {
    this.module = null
    this.ready = false
    this.initPromise = null
  }
}

export function createBasisTranscoder(opts?: BasisTranscoderOptions): BasisTranscoder {
  if (opts?.impl) return opts.impl
  if (opts?.mode === 'stub') return new StubBasisTranscoder(opts.transcoderPath)
  if (opts?.mode === 'wasm' || opts?.mode === 'auto' || opts?.mode === undefined) {
    return new VendorBasisTranscoder(opts?.transcoderPath ?? VENDOR_BASIS_PATH)
  }
  return new StubBasisTranscoder(opts?.transcoderPath)
}
