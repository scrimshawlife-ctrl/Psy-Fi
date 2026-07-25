/**
 * Pluggable Draco WASM decode bridge.
 * Decode stays off the render critical path (worker or async main).
 * Default is a stub until `draco_decoder.wasm` (or equivalent) is configured.
 */

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
  decode(req: DracoDecodeRequest): Promise<DracoDecodedMesh>
  dispose(): void
}

export interface DracoWasmDecoderOptions {
  /** Absolute or packaged URL to decoder WASM / JS glue (optional). */
  wasmUrl?: string
  /** Injected decoder for tests / future three.js DRACOLoader wrap. */
  impl?: DracoWasmDecoder
}

/**
 * Stub decoder — refuses compressed bitstreams but documents the contract.
 * Replace via `createDracoWasmDecoder({ impl })` or wasmUrl when assets ship.
 */
export class StubDracoWasmDecoder implements DracoWasmDecoder {
  readonly ready = false
  readonly kind = 'stub' as const

  async decode(_req: DracoDecodeRequest): Promise<DracoDecodedMesh> {
    throw new Error(
      'draco: WASM decoder not configured — set createDracoWasmDecoder({ wasmUrl | impl })',
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
    // Test convention: bitstream is raw Float32Array xyz triples (+ optional u32 index count header).
    const view = new DataView(req.bitstream)
    if (req.bitstream.byteLength < 8) throw new Error('draco passthrough: buffer too small')
    const magic = view.getUint32(0, true)
    if (magic !== 0x50535944) {
      // 'PSYD' — psyfi synthetic draco-like pack
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

export function createDracoWasmDecoder(opts?: DracoWasmDecoderOptions): DracoWasmDecoder {
  if (opts?.impl) return opts.impl
  if (opts?.wasmUrl) {
    // Placeholder registration point — real glue loads asynchronously in a follow-up
    // when decoder assets are vendored. Until then, return stub that names the URL.
    const url = opts.wasmUrl
    return {
      ready: false,
      kind: 'stub',
      async decode() {
        throw new Error(`draco: WASM at ${url} not loaded (vendor decoder assets to enable)`)
      },
      dispose() {
        /* no-op */
      },
    }
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
