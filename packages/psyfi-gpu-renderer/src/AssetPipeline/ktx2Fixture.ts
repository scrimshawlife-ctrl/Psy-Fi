/** Build minimal uncompressed RGBA8 KTX2 bytes for tests. */
import { KTX2_IDENTIFIER, VK_FORMAT_R8G8B8A8_UNORM } from './ktx2Parse'

function writeU64(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true)
  view.setUint32(offset + 4, Math.floor(value / 0x1_0000_0000), true)
}

export function makeUncompressedRgba8Ktx2(width: number, height: number, mipCount = 1): ArrayBuffer {
  const levels: { w: number; h: number; data: Uint8Array }[] = []
  for (let level = 0; level < mipCount; level++) {
    const w = Math.max(1, width >> level)
    const h = Math.max(1, height >> level)
    const data = new Uint8Array(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (level * 40) & 255
      data[i + 1] = 128
      data[i + 2] = 255
      data[i + 3] = 255
    }
    levels.push({ w, h, data })
  }

  const levelIndexStart = 96
  const levelIndexBytes = mipCount * 24
  let dataStart = levelIndexStart + levelIndexBytes
  // Align data start to 16 bytes (common KTX2 practice)
  dataStart = Math.ceil(dataStart / 16) * 16

  const levelRecords: { offset: number; length: number }[] = []
  let cursor = dataStart
  for (const level of levels) {
    levelRecords.push({ offset: cursor, length: level.data.byteLength })
    cursor += level.data.byteLength
  }

  const buf = new ArrayBuffer(cursor)
  const u8 = new Uint8Array(buf)
  const view = new DataView(buf)
  u8.set(KTX2_IDENTIFIER, 0)
  view.setUint32(12, VK_FORMAT_R8G8B8A8_UNORM, true)
  view.setUint32(16, 1, true) // typeSize
  view.setUint32(20, width, true)
  view.setUint32(24, height, true)
  view.setUint32(28, 0, true) // depth
  view.setUint32(32, 0, true) // layerCount → treat as 1
  view.setUint32(36, 1, true) // faceCount
  view.setUint32(40, mipCount, true)
  view.setUint32(44, 0, true) // supercompression none
  writeU64(view, 48, 0) // dfd
  writeU64(view, 56, 0)
  writeU64(view, 64, 0) // kvd
  writeU64(view, 72, 0)
  writeU64(view, 80, 0) // sgd
  writeU64(view, 88, 0)

  for (let i = 0; i < mipCount; i++) {
    const base = levelIndexStart + i * 24
    const rec = levelRecords[i]
    writeU64(view, base, rec.offset)
    writeU64(view, base + 8, rec.length)
    writeU64(view, base + 16, rec.length)
    u8.set(levels[i].data, rec.offset)
  }

  return buf
}

/** BasisLZ-marked KTX2 header (no real SGD) — for deferred transcoder plans. */
export function makeBasisLzKtx2Stub(width: number, height: number): ArrayBuffer {
  const buf = makeUncompressedRgba8Ktx2(width, height, 1)
  const view = new DataView(buf)
  view.setUint32(12, 0, true) // vkFormat UNDEFINED for Basis
  view.setUint32(44, 1, true) // SupercompressionScheme BasisLZ
  return buf
}
