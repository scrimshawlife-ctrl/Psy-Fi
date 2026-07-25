import { describe, expect, it, vi } from 'vitest'
import { AssetLoader } from './AssetLoader'
import {
  PassthroughDracoWasmDecoder,
  StubDracoWasmDecoder,
  encodePsydPack,
} from './dracoBridge'
import { createMockGpuUploadDevice, GpuAssetUploader } from './GpuAssetUploader'
import { makeBasisLzKtx2Stub, makeUncompressedRgba8Ktx2 } from './ktx2Fixture'
import { parseKtx2Container } from './ktx2Parse'
import { planDracoMeshUpload, planKtx2Upload, planLoadedAssetUpload } from './uploadPlan'

describe('KTX2 parse + GPU upload', () => {
  it('parses level index and marks RGBA8 uncompressed as GPU-ready', () => {
    const bytes = makeUncompressedRgba8Ktx2(4, 4, 2)
    const c = parseKtx2Container(bytes)
    expect(c.width).toBe(4)
    expect(c.height).toBe(4)
    expect(c.levelCount).toBe(2)
    expect(c.supercompression).toBe('none')
    expect(c.gpuReadyUncompressed).toBe(true)
    expect(c.levels[0].byteLength).toBe(4 * 4 * 4)
    expect(c.levels[1].byteLength).toBe(2 * 2 * 4)
  })

  it('plans and uploads mip chain via writeTexture', () => {
    const bytes = makeUncompressedRgba8Ktx2(4, 4, 2)
    const plan = planKtx2Upload('tex', bytes)
    expect(plan.kind).toBe('texture2d')
    if (plan.kind !== 'texture2d') return
    expect(plan.mipCount).toBe(2)

    const device = createMockGpuUploadDevice()
    const uploaded = new GpuAssetUploader(device).upload(plan)
    expect(uploaded.kind).toBe('texture2d')
    expect(device.textures).toHaveLength(1)
    expect(device.textures[0].mipLevelCount).toBe(2)
    expect(device.textureWrites).toHaveLength(2)
    expect(device.textureWrites[0].width).toBe(4)
    expect(device.textureWrites[1].width).toBe(2)
  })

  it('defers BasisLZ KTX2 to transcoder', () => {
    const plan = planKtx2Upload('basis', makeBasisLzKtx2Stub(8, 8))
    expect(plan.kind).toBe('deferred')
    if (plan.kind !== 'deferred') return
    expect(plan.needs).toBe('basis-transcoder')
  })
})

describe('Draco WASM bridge + mesh upload', () => {
  it('stub decoder is not ready and plans defer', async () => {
    const stub = new StubDracoWasmDecoder()
    expect(stub.ready).toBe(false)
    const plan = await planDracoMeshUpload('m', new ArrayBuffer(16), stub)
    expect(plan.kind).toBe('deferred')
    if (plan.kind === 'deferred') expect(plan.needs).toBe('draco-wasm')
  })

  it('passthrough PSYD pack uploads vertex + index buffers', async () => {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
    const indices = new Uint32Array([0, 1, 2])
    const bitstream = encodePsydPack(positions, indices)
    const plan = await planDracoMeshUpload('mesh', bitstream, new PassthroughDracoWasmDecoder())
    expect(plan.kind).toBe('mesh')
    if (plan.kind !== 'mesh') return

    const device = createMockGpuUploadDevice()
    const uploaded = new GpuAssetUploader(device).upload(plan)
    expect(uploaded.kind).toBe('mesh')
    expect(device.buffers.length).toBe(2) // position + index
    expect(device.bufferWrites.length).toBe(2)
  })
})

describe('AssetLoader loadAndUpload', () => {
  it('loads KTX2 and uploads on the GPU path', async () => {
    const bytes = makeUncompressedRgba8Ktx2(2, 2, 1)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => bytes,
      }),
    )
    const loader = new AssetLoader()
    const device = createMockGpuUploadDevice()
    const { plan, uploaded, asset } = await loader.loadAndUpload(
      { id: 'k', kind: 'ktx2', url: '/t.ktx2' },
      device,
    )
    expect(asset.meta?.kind).toBe('ktx2')
    if (asset.meta?.kind === 'ktx2') {
      expect(asset.meta.gpuReadyUncompressed).toBe(true)
    }
    expect(plan.kind).toBe('texture2d')
    expect(uploaded.kind).toBe('texture2d')
    expect(device.textureWrites).toHaveLength(1)
    loader.dispose()
    vi.unstubAllGlobals()
  })

  it('marks Draco glTF as deferred needing WASM', () => {
    const asset = {
      id: 'g',
      kind: 'gltf' as const,
      bytes: new ArrayBuffer(0),
      meta: {
        kind: 'gltf' as const,
        container: 'gltf-json' as const,
        meshCount: 1,
        materialCount: 0,
        hasDraco: true,
      },
    }
    const plan = planLoadedAssetUpload(asset)
    expect(plan.kind).toBe('deferred')
    if (plan.kind === 'deferred') expect(plan.needs).toBe('draco-wasm')
  })
})
