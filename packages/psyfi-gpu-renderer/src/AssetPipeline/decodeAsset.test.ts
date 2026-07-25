import { describe, expect, it } from 'vitest'
import { decodeGltfBytes, decodeKtx2Bytes, decodeSplatBytes } from './decodeAsset'

function encodeGltfJson(obj: object): ArrayBuffer {
  return new TextEncoder().encode(JSON.stringify(obj)).buffer
}

function makeGlb(json: object): ArrayBuffer {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json))
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4
  const jsonChunkLen = jsonBytes.length + jsonPad
  const total = 12 + 8 + jsonChunkLen
  const buf = new ArrayBuffer(total)
  const view = new DataView(buf)
  const u8 = new Uint8Array(buf)
  view.setUint32(0, 0x46546c67, true) // magic
  view.setUint32(4, 2, true) // version
  view.setUint32(8, total, true)
  view.setUint32(12, jsonChunkLen, true)
  view.setUint32(16, 0x4e4f534a, true) // JSON
  u8.set(jsonBytes, 20)
  return buf
}

describe('decodeAsset', () => {
  it('parses glTF JSON and detects Draco extension', () => {
    const meta = decodeGltfBytes(
      encodeGltfJson({
        asset: { generator: 'test' },
        meshes: [{}, {}],
        materials: [{}],
        extensionsUsed: ['KHR_draco_mesh_compression'],
      }),
    )
    expect(meta.container).toBe('gltf-json')
    expect(meta.meshCount).toBe(2)
    expect(meta.hasDraco).toBe(true)
    expect(meta.generator).toBe('test')
  })

  it('parses GLB container', () => {
    const meta = decodeGltfBytes(
      makeGlb({
        asset: { version: '2.0' },
        meshes: [{}],
        materials: [],
      }),
    )
    expect(meta.container).toBe('glb')
    expect(meta.meshCount).toBe(1)
    expect(meta.hasDraco).toBe(false)
  })

  it('parses KTX2 header fields', () => {
    const buf = new ArrayBuffer(48)
    const u8 = new Uint8Array(buf)
    const id = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]
    u8.set(id, 0)
    const view = new DataView(buf)
    view.setUint32(12, 123, true) // vkFormat
    view.setUint32(16, 1, true) // typeSize
    view.setUint32(20, 256, true) // width
    view.setUint32(24, 128, true) // height
    view.setUint32(28, 0, true)
    view.setUint32(32, 1, true)
    view.setUint32(36, 1, true)
    view.setUint32(40, 5, true)
    const meta = decodeKtx2Bytes(buf)
    expect(meta.width).toBe(256)
    expect(meta.height).toBe(128)
    expect(meta.levelCount).toBe(5)
    expect(meta.vkFormat).toBe(123)
  })

  it('records splat byte length', () => {
    expect(decodeSplatBytes(new ArrayBuffer(99)).byteLength).toBe(99)
  })
})
