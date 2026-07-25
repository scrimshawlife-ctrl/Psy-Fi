/**
 * Pluggable Draco WASM decode bridge.
 * Decode stays off the render critical path (worker or async main).
 * Default uses the vendored/npm `draco3d` decoder (glTF-compatible family).
 */

import { VENDOR_DRACO_GLTF_PATH } from './vendorPaths'

export interface DracoAttributeBuffer {
  name: string
  /** Interleaved or tightly packed float32 components. */
  data: Float32Array
  itemSize: number
  count: number
}

export interface DracoDecodedMesh {
  attributes: DracoAttributeBuffer[]
  indices?: Uint32Array
  decoder: 'wasm' | 'stub'
}

export interface DracoDecodeRequest {
  /** Compressed Draco bitstream (glTF bufferView bytes). */
  bitstream: ArrayBuffer
  /** Attribute semantic → Draco unique id (from KHR_draco_mesh_compression). */
  attributes?: Record<string, number>
}

export interface DracoWasmDecoder {
  readonly ready: boolean
  readonly kind: 'wasm' | 'stub'
  /** Optional lazy init for vendor WASM modules. */
  ensureReady?: () => Promise<void>
  decode(req: DracoDecodeRequest): Promise<DracoDecodedMesh>
  dispose(): void
}

export interface DracoWasmDecoderOptions {
  /** Absolute or packaged URL to decoder WASM / JS glue (optional, browser hint). */
  wasmUrl?: string
  /** Injected decoder for tests / custom loaders. */
  impl?: DracoWasmDecoder
  /** Force stub / passthrough / npm wasm. Default: npm wasm when available. */
  mode?: 'auto' | 'stub' | 'passthrough' | 'wasm'
}

type DracoDecoderModule = {
  Decoder: new () => {
    GetEncodedGeometryType: (buf: unknown) => number
    DecodeBufferToMesh: (buf: unknown, mesh: unknown) => { ok: () => boolean; error_msg?: () => string }
    GetAttributeId: (mesh: unknown, attr: unknown) => number
    GetAttribute: (mesh: unknown, id: number) => unknown
    GetAttributeFloatForAllPoints: (mesh: unknown, attr: unknown, out: unknown) => void
    GetFaceFromMesh: (mesh: unknown, face: number, out: unknown) => void
  }
  DecoderBuffer: new () => { Init: (data: Int8Array, len: number) => void }
  Mesh: new () => { num_points: () => number; num_faces: () => number }
  DracoFloat32Array: new () => { GetValue: (i: number) => number; size: () => number }
  DracoInt32Array: new () => { GetValue: (i: number) => number }
  POSITION: unknown
  NORMAL: unknown
  COLOR: unknown
  TEX_COORD: unknown
  TRIANGULAR_MESH: number
  destroy: (obj: unknown) => void
}

type Draco3dPkg = {
  createDecoderModule: (cfg?: Record<string, unknown>) => Promise<DracoDecoderModule>
}

/**
 * Stub decoder — refuses compressed bitstreams but documents the contract.
 */
export class StubDracoWasmDecoder implements DracoWasmDecoder {
  readonly ready = false
  readonly kind = 'stub' as const

  async decode(_req: DracoDecodeRequest): Promise<DracoDecodedMesh> {
    throw new Error(
      'draco: WASM decoder not configured — set createDracoWasmDecoder({ mode: "wasm" | impl })',
    )
  }

  dispose(): void {
    /* no-op */
  }
}

/** Passthrough for already-decoded float attribute packs (tests / procedural caches). */
export class PassthroughDracoWasmDecoder implements DracoWasmDecoder {
  readonly ready = true
  readonly kind = 'wasm' as const

  async decode(req: DracoDecodeRequest): Promise<DracoDecodedMesh> {
    const view = new DataView(req.bitstream)
    if (req.bitstream.byteLength < 8) throw new Error('draco passthrough: buffer too small')
    const magic = view.getUint32(0, true)
    if (magic !== 0x50535944) {
      throw new Error('draco passthrough: expected PSYD pack (use real WASM for KHR_draco)')
    }
    const vertexCount = view.getUint32(4, true)
    const indexCount = view.getUint32(8, true)
    const posOffset = 12
    const posFloats = vertexCount * 3
    const positions = new Float32Array(req.bitstream, posOffset, posFloats)
    const indexOffset = posOffset + posFloats * 4
    const indices =
      indexCount > 0 ? new Uint32Array(req.bitstream, indexOffset, indexCount) : undefined
    return {
      decoder: 'wasm',
      attributes: [
        {
          name: 'POSITION',
          data: positions.slice(),
          itemSize: 3,
          count: vertexCount,
        },
      ],
      indices: indices ? indices.slice() : undefined,
    }
  }

  dispose(): void {
    /* no-op */
  }
}

/**
 * Real Draco decoder via the `draco3d` npm package (same family as vendored glTF WASM).
 * Browser packaging still ships `/gpu/vendor/draco/gltf/` for DRACOLoader-style URL loads.
 */
export class Draco3dWasmDecoder implements DracoWasmDecoder {
  ready = false
  readonly kind = 'wasm' as const
  readonly vendorPath = VENDOR_DRACO_GLTF_PATH
  private module: DracoDecoderModule | null = null
  private initPromise: Promise<void> | null = null

  ensureReady = async (): Promise<void> => {
    if (this.ready && this.module) return
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const mod = (await import('draco3d')) as unknown as Draco3dPkg & { default?: Draco3dPkg }
        const pkg = (mod.default ?? mod) as Draco3dPkg
        this.module = await pkg.createDecoderModule({})
        this.ready = true
      })()
    }
    await this.initPromise
  }

  async decode(req: DracoDecodeRequest): Promise<DracoDecodedMesh> {
    await this.ensureReady()
    const module = this.module
    if (!module) throw new Error('draco: decoder module missing after init')

    const decoder = new module.Decoder()
    const buffer = new module.DecoderBuffer()
    const mesh = new module.Mesh()
    const bytes = new Int8Array(req.bitstream)
    try {
      buffer.Init(bytes, bytes.length)
      const geomType = decoder.GetEncodedGeometryType(buffer)
      if (geomType !== module.TRIANGULAR_MESH) {
        throw new Error(`draco: expected triangular mesh, got type ${geomType}`)
      }
      const status = decoder.DecodeBufferToMesh(buffer, mesh)
      if (!status.ok()) {
        throw new Error(`draco: decode failed${status.error_msg ? `: ${status.error_msg()}` : ''}`)
      }

      const attributes: DracoAttributeBuffer[] = []
      const semanticMap: Array<[string, unknown, number]> = [
        ['POSITION', module.POSITION, 3],
        ['NORMAL', module.NORMAL, 3],
        ['COLOR', module.COLOR, 3],
        ['TEXCOORD_0', module.TEX_COORD, 2],
      ]
      for (const [name, semantic, itemSize] of semanticMap) {
        let attrId = -1
        if (req.attributes && name in req.attributes) {
          attrId = req.attributes[name]!
        } else {
          attrId = decoder.GetAttributeId(mesh, semantic)
        }
        if (attrId < 0) continue
        const attr = decoder.GetAttribute(mesh, attrId)
        const scratch = new module.DracoFloat32Array()
        decoder.GetAttributeFloatForAllPoints(mesh, attr, scratch)
        const count = mesh.num_points()
        const data = new Float32Array(count * itemSize)
        for (let i = 0; i < data.length; i++) data[i] = scratch.GetValue(i)
        module.destroy(scratch)
        attributes.push({ name, data, itemSize, count })
      }
      if (!attributes.some((a) => a.name === 'POSITION')) {
        throw new Error('draco: POSITION attribute missing')
      }

      const numFaces = mesh.num_faces()
      let indices: Uint32Array | undefined
      if (numFaces > 0) {
        indices = new Uint32Array(numFaces * 3)
        const ia = new module.DracoInt32Array()
        for (let f = 0; f < numFaces; f++) {
          decoder.GetFaceFromMesh(mesh, f, ia)
          const base = f * 3
          indices[base] = ia.GetValue(0)
          indices[base + 1] = ia.GetValue(1)
          indices[base + 2] = ia.GetValue(2)
        }
        module.destroy(ia)
      }

      return { decoder: 'wasm', attributes, indices }
    } finally {
      module.destroy(buffer)
      module.destroy(mesh)
      module.destroy(decoder)
    }
  }

  dispose(): void {
    this.module = null
    this.ready = false
    this.initPromise = null
  }
}

export function createDracoWasmDecoder(opts?: DracoWasmDecoderOptions): DracoWasmDecoder {
  if (opts?.impl) return opts.impl
  if (opts?.mode === 'stub') return new StubDracoWasmDecoder()
  if (opts?.mode === 'passthrough') return new PassthroughDracoWasmDecoder()
  if (opts?.wasmUrl) {
    // URL is recorded for browser DRACOLoader-style loads; decode still uses npm WASM.
    const decoder = new Draco3dWasmDecoder()
    ;(decoder as Draco3dWasmDecoder & { wasmUrl: string }).wasmUrl = opts.wasmUrl
    return decoder
  }
  if (opts?.mode === 'wasm' || opts?.mode === 'auto' || opts?.mode === undefined) {
    return new Draco3dWasmDecoder()
  }
  return new StubDracoWasmDecoder()
}

/** Build a synthetic PSYD pack for unit tests (not real Draco). */
export function encodePsydPack(positions: Float32Array, indices?: Uint32Array): ArrayBuffer {
  const indexCount = indices?.length ?? 0
  const buf = new ArrayBuffer(12 + positions.byteLength + indexCount * 4)
  const view = new DataView(buf)
  view.setUint32(0, 0x50535944, true)
  view.setUint32(4, positions.length / 3, true)
  view.setUint32(8, indexCount, true)
  new Float32Array(buf, 12, positions.length).set(positions)
  if (indices && indexCount) {
    new Uint32Array(buf, 12 + positions.byteLength, indexCount).set(indices)
  }
  return buf
}

/** Encode a tiny triangle with real Draco (test helper). */
export async function encodeDracoTriangle(): Promise<ArrayBuffer> {
  const mod = (await import('draco3d')) as unknown as {
    default?: unknown
    createEncoderModule: (cfg?: Record<string, unknown>) => Promise<{
      Encoder: new () => {
        SetSpeedOptions: (a: number, b: number) => void
        SetAttributeQuantization: (attr: unknown, bits: number) => void
        SetEncodingMethod: (m: unknown) => void
        EncodeMeshToDracoBuffer: (mesh: unknown, out: unknown) => number
      }
      MeshBuilder: new () => {
        AddFacesToMesh: (mesh: unknown, faces: number, indices: Uint32Array) => unknown
        AddFloatAttributeToMesh: (
          mesh: unknown,
          attr: unknown,
          numPoints: number,
          itemSize: number,
          data: Float32Array,
        ) => number
      }
      Mesh: new () => unknown
      DracoInt8Array: new () => { GetValue: (i: number) => number }
      POSITION: unknown
      MESH_EDGEBREAKER_ENCODING: unknown
      destroy: (obj: unknown) => void
    }>
  }
  const pkg = (mod.default ?? mod) as typeof mod
  const enc = await pkg.createEncoderModule({})
  const encoder = new enc.Encoder()
  const builder = new enc.MeshBuilder()
  const mesh = new enc.Mesh()
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
  const indices = new Uint32Array([0, 1, 2])
  builder.AddFacesToMesh(mesh, 1, indices)
  builder.AddFloatAttributeToMesh(mesh, enc.POSITION, 3, 3, positions)
  encoder.SetSpeedOptions(5, 5)
  encoder.SetAttributeQuantization(enc.POSITION, 14)
  encoder.SetEncodingMethod(enc.MESH_EDGEBREAKER_ENCODING)
  const out = new enc.DracoInt8Array()
  const len = encoder.EncodeMeshToDracoBuffer(mesh, out)
  if (len <= 0) throw new Error('draco: encode failed')
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = out.GetValue(i) & 0xff
  enc.destroy(out)
  enc.destroy(mesh)
  enc.destroy(builder)
  enc.destroy(encoder)
  return bytes.buffer
}
