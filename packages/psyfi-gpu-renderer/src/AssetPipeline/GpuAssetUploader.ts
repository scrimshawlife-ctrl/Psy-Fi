/**
 * Upload planned GPU assets to a WebGPU device.
 * Texture path uses queue.writeTexture; mesh path creates vertex/index buffers.
 */

import type {
  DeferredUploadPlan,
  GpuUploadPlan,
  MeshUploadPlan,
  Texture2dUploadPlan,
} from './uploadPlan'

export interface UploadedTexture2d {
  kind: 'texture2d'
  id: string
  texture: GPUTexture
  width: number
  height: number
  mipCount: number
  format: GPUTextureFormat
}

export interface UploadedMesh {
  kind: 'mesh'
  id: string
  vertexBuffers: { name: string; buffer: GPUBuffer; itemSize: number; count: number }[]
  indexBuffer?: GPUBuffer
  indexCount?: number
}

export interface DeferredUpload {
  kind: 'deferred'
  id: string
  plan: DeferredUploadPlan
}

export type UploadedAsset = UploadedTexture2d | UploadedMesh | DeferredUpload

/** Minimal device surface used by the uploader (real GPUDevice satisfies this). */
export interface GpuUploadDevice {
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer
  queue: {
    writeTexture(
      destination: GPUTexelCopyTextureInfo,
      data: ArrayBuffer | ArrayBufferView,
      dataLayout: GPUTexelCopyBufferLayout,
      size: GPUExtent3DStrict,
    ): void
    writeBuffer(
      buffer: GPUBuffer,
      bufferOffset: number,
      data: ArrayBuffer | ArrayBufferView,
      dataOffset?: number,
      size?: number,
    ): void
  }
}

/** Numeric WebGPU usage flags — avoid relying on browser globals in Node tests. */
const TEX_COPY_DST = 0x02
const TEX_BINDING = 0x04
const TEX_RENDER = 0x10
const BUF_COPY_DST = 0x08
const BUF_INDEX = 0x10
const BUF_VERTEX = 0x20

export class GpuAssetUploader {
  constructor(private readonly device: GpuUploadDevice) {}

  upload(plan: GpuUploadPlan): UploadedAsset {
    if (plan.kind === 'deferred') {
      return { kind: 'deferred', id: plan.id, plan }
    }
    if (plan.kind === 'texture2d') return this.uploadTexture(plan)
    return this.uploadMesh(plan)
  }

  private uploadTexture(plan: Texture2dUploadPlan): UploadedTexture2d {
    const texture = this.device.createTexture({
      label: `psyfi/${plan.id}`,
      size: { width: plan.width, height: plan.height, depthOrArrayLayers: 1 },
      mipLevelCount: plan.mipCount,
      format: plan.format,
      usage: TEX_BINDING | TEX_COPY_DST | TEX_RENDER,
    })

    for (const mip of plan.mips) {
      this.device.queue.writeTexture(
        { texture, mipLevel: mip.level },
        mip.bytes,
        { bytesPerRow: mip.bytesPerRow, rowsPerImage: mip.height },
        { width: mip.width, height: mip.height, depthOrArrayLayers: 1 },
      )
    }

    return {
      kind: 'texture2d',
      id: plan.id,
      texture,
      width: plan.width,
      height: plan.height,
      mipCount: plan.mipCount,
      format: plan.format,
    }
  }

  private uploadMesh(plan: MeshUploadPlan): UploadedMesh {
    const vertexBuffers = plan.attributes.map((attr) => {
      const buffer = this.device.createBuffer({
        label: `psyfi/${plan.id}/${attr.name}`,
        size: attr.array.byteLength,
        usage: BUF_VERTEX | BUF_COPY_DST,
      })
      this.device.queue.writeBuffer(buffer, 0, attr.array)
      return {
        name: attr.name,
        buffer,
        itemSize: attr.itemSize,
        count: attr.array.length / attr.itemSize,
      }
    })

    let indexBuffer: GPUBuffer | undefined
    let indexCount: number | undefined
    if (plan.indices && plan.indices.length) {
      indexBuffer = this.device.createBuffer({
        label: `psyfi/${plan.id}/indices`,
        size: plan.indices.byteLength,
        usage: BUF_INDEX | BUF_COPY_DST,
      })
      this.device.queue.writeBuffer(indexBuffer, 0, plan.indices)
      indexCount = plan.indices.length
    }

    return { kind: 'mesh', id: plan.id, vertexBuffers, indexBuffer, indexCount }
  }
}

/** Test double that records uploads without a real adapter. */
export function createMockGpuUploadDevice(): GpuUploadDevice & {
  textures: GPUTextureDescriptor[]
  buffers: GPUBufferDescriptor[]
  textureWrites: { mipLevel: number; byteLength: number; width: number; height: number }[]
  bufferWrites: { size: number }[]
} {
  const textures: GPUTextureDescriptor[] = []
  const buffers: GPUBufferDescriptor[] = []
  const textureWrites: { mipLevel: number; byteLength: number; width: number; height: number }[] = []
  const bufferWrites: { size: number }[] = []

  const fakeTexture = {} as GPUTexture
  const fakeBuffer = {} as GPUBuffer

  return {
    textures,
    buffers,
    textureWrites,
    bufferWrites,
    createTexture(descriptor) {
      textures.push(descriptor)
      return fakeTexture
    },
    createBuffer(descriptor) {
      buffers.push(descriptor)
      return fakeBuffer
    },
    queue: {
      writeTexture(destination, data, _layout, size) {
        const extent = size as GPUExtent3DDict
        textureWrites.push({
          mipLevel: destination.mipLevel ?? 0,
          byteLength: (data as ArrayBufferView).byteLength ?? (data as ArrayBuffer).byteLength,
          width: Number(extent.width),
          height: Number(extent.height ?? 1),
        })
      },
      writeBuffer(_buffer, _offset, data) {
        const len =
          (data as ArrayBufferView).byteLength ?? (data as ArrayBuffer).byteLength
        bufferWrites.push({ size: len })
      },
    },
  }
}
