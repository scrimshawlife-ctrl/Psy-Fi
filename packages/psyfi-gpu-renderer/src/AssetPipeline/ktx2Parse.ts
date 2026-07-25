/**
 * KTX2 container parse beyond the basic header — level index + upload slices.
 * Spec: https://github.khronos.org/KTX-Specification/
 */

export const KTX2_IDENTIFIER = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a] as const

/** VK_FORMAT_R8G8B8A8_UNORM — common uncompressed test / fallback format. */
export const VK_FORMAT_R8G8B8A8_UNORM = 37

export type Ktx2Supercompression = 'none' | 'basislz' | 'zstd' | 'zlib' | 'unknown'

export interface Ktx2LevelSlice {
  level: number
  byteOffset: number
  byteLength: number
  uncompressedByteLength: number
}

export interface Ktx2Container {
  vkFormat: number
  typeSize: number
  width: number
  height: number
  depth: number
  layerCount: number
  faceCount: number
  levelCount: number
  supercompressionScheme: number
  supercompression: Ktx2Supercompression
  dfdByteOffset: number
  dfdByteLength: number
  levels: Ktx2LevelSlice[]
  /** True when payload can be `writeTexture`'d without a transcoder. */
  gpuReadyUncompressed: boolean
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true)
}

function readU64(view: DataView, offset: number): number {
  // Level offsets fit in Number for our fixtures / typical assets (< 2^53).
  const lo = view.getUint32(offset, true)
  const hi = view.getUint32(offset + 4, true)
  return hi * 0x1_0000_0000 + lo
}

function mapSupercompression(scheme: number): Ktx2Supercompression {
  if (scheme === 0) return 'none'
  if (scheme === 1) return 'basislz'
  if (scheme === 2) return 'zstd'
  if (scheme === 3) return 'zlib'
  return 'unknown'
}

export function assertKtx2Identifier(bytes: ArrayBuffer): void {
  const u8 = new Uint8Array(bytes)
  if (bytes.byteLength < 96) throw new Error('ktx2: buffer too small for header')
  for (let i = 0; i < KTX2_IDENTIFIER.length; i++) {
    if (u8[i] !== KTX2_IDENTIFIER[i]) throw new Error('ktx2: bad identifier')
  }
}

export function parseKtx2Container(bytes: ArrayBuffer): Ktx2Container {
  assertKtx2Identifier(bytes)
  const view = new DataView(bytes)
  const vkFormat = readU32(view, 12)
  const typeSize = readU32(view, 16)
  const width = readU32(view, 20)
  const height = readU32(view, 24)
  const depth = readU32(view, 28)
  const layerCount = Math.max(1, readU32(view, 32) || 1)
  const faceCount = Math.max(1, readU32(view, 36) || 1)
  const levelCount = Math.max(1, readU32(view, 40) || 1)
  const supercompressionScheme = readU32(view, 44)
  const dfdByteOffset = readU64(view, 48)
  const dfdByteLength = readU64(view, 56)
  const supercompression = mapSupercompression(supercompressionScheme)

  const levelIndexStart = 96
  const levelIndexBytes = levelCount * 24
  if (bytes.byteLength < levelIndexStart + levelIndexBytes) {
    throw new Error('ktx2: truncated level index')
  }

  const levels: Ktx2LevelSlice[] = []
  for (let i = 0; i < levelCount; i++) {
    const base = levelIndexStart + i * 24
    levels.push({
      level: i,
      byteOffset: readU64(view, base),
      byteLength: readU64(view, base + 8),
      uncompressedByteLength: readU64(view, base + 16),
    })
  }

  const gpuReadyUncompressed =
    supercompression === 'none' && vkFormat === VK_FORMAT_R8G8B8A8_UNORM && width > 0 && height > 0

  return {
    vkFormat,
    typeSize,
    width,
    height,
    depth,
    layerCount,
    faceCount,
    levelCount,
    supercompressionScheme,
    supercompression,
    dfdByteOffset,
    dfdByteLength,
    levels,
    gpuReadyUncompressed,
  }
}

/** Extract mip level payload bytes (copy — safe across worker transfer). */
export function sliceKtx2Level(bytes: ArrayBuffer, level: Ktx2LevelSlice): Uint8Array {
  if (level.byteOffset + level.byteLength > bytes.byteLength) {
    throw new Error(`ktx2: level ${level.level} out of range`)
  }
  return new Uint8Array(bytes, level.byteOffset, level.byteLength).slice()
}
