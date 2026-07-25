import type { AssetKind } from './AssetLoader'
import { parseKtx2Container, type Ktx2Supercompression } from './ktx2Parse'

export interface GltfDecodeMeta {
  kind: 'gltf'
  container: 'gltf-json' | 'glb'
  meshCount: number
  materialCount: number
  hasDraco: boolean
  generator?: string
}

export interface Ktx2DecodeMeta {
  kind: 'ktx2'
  width: number
  height: number
  layerCount: number
  faceCount: number
  levelCount: number
  vkFormat: number
  supercompression: Ktx2Supercompression
  gpuReadyUncompressed: boolean
}

export interface SplatDecodeMeta {
  kind: 'splat'
  byteLength: number
}

export type AssetDecodeMeta = GltfDecodeMeta | Ktx2DecodeMeta | SplatDecodeMeta

export interface DecodedAssetPayload {
  id: string
  kind: AssetKind
  bytes: ArrayBuffer
  meta: AssetDecodeMeta
}

const GLB_MAGIC = 0x46546c67 // 'glTF'
const KTX2_ID = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]

function readU32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true)
}

export function decodeGltfBytes(bytes: ArrayBuffer): GltfDecodeMeta {
  const view = new DataView(bytes)
  if (bytes.byteLength >= 12 && readU32LE(view, 0) === GLB_MAGIC) {
    const jsonLength = readU32LE(view, 12)
    const jsonStart = 20
    const jsonBytes = new Uint8Array(bytes, jsonStart, jsonLength)
    const text = new TextDecoder().decode(jsonBytes)
    return summarizeGltfJson(text, 'glb')
  }
  const text = new TextDecoder().decode(bytes)
  return summarizeGltfJson(text, 'gltf-json')
}

function summarizeGltfJson(text: string, container: 'gltf-json' | 'glb'): GltfDecodeMeta {
  const json = JSON.parse(text) as {
    meshes?: unknown[]
    materials?: unknown[]
    extensionsUsed?: string[]
    asset?: { generator?: string }
  }
  const used = json.extensionsUsed || []
  return {
    kind: 'gltf',
    container,
    meshCount: Array.isArray(json.meshes) ? json.meshes.length : 0,
    materialCount: Array.isArray(json.materials) ? json.materials.length : 0,
    hasDraco: used.some((e) => /draco/i.test(e)),
    generator: json.asset?.generator,
  }
}

export function decodeKtx2Bytes(bytes: ArrayBuffer): Ktx2DecodeMeta {
  // Prefer full container parse; fall back to legacy 48-byte header for tiny fixtures.
  try {
    const c = parseKtx2Container(bytes)
    return {
      kind: 'ktx2',
      width: c.width,
      height: c.height,
      layerCount: c.layerCount,
      faceCount: c.faceCount,
      levelCount: c.levelCount,
      vkFormat: c.vkFormat,
      supercompression: c.supercompression,
      gpuReadyUncompressed: c.gpuReadyUncompressed,
    }
  } catch {
    const u8 = new Uint8Array(bytes)
    if (bytes.byteLength < 48) throw new Error('ktx2: buffer too small')
    for (let i = 0; i < KTX2_ID.length; i++) {
      if (u8[i] !== KTX2_ID[i]) throw new Error('ktx2: bad identifier')
    }
    const view = new DataView(bytes)
    const vkFormat = readU32LE(view, 12)
    const pixelWidth = readU32LE(view, 20)
    const pixelHeight = readU32LE(view, 24)
    const layerCount = Math.max(1, readU32LE(view, 32) || 1)
    const faceCount = Math.max(1, readU32LE(view, 36) || 1)
    const levelCount = Math.max(1, readU32LE(view, 40) || 1)
    return {
      kind: 'ktx2',
      width: pixelWidth,
      height: pixelHeight,
      layerCount,
      faceCount,
      levelCount,
      vkFormat,
      supercompression: 'unknown',
      gpuReadyUncompressed: false,
    }
  }
}

export function decodeSplatBytes(bytes: ArrayBuffer): SplatDecodeMeta {
  return { kind: 'splat', byteLength: bytes.byteLength }
}

export function decodeAssetBytes(kind: AssetKind, bytes: ArrayBuffer): AssetDecodeMeta {
  if (kind === 'gltf') return decodeGltfBytes(bytes)
  if (kind === 'ktx2') return decodeKtx2Bytes(bytes)
  return decodeSplatBytes(bytes)
}
