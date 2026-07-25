/**
 * Build GPU upload plans from decoded asset bytes (KTX2 / Draco-ready glTF).
 * Planning is pure CPU; actual device writes live in GpuAssetUploader.
 */

import type { LoadedAsset } from './AssetLoader'
import { parseKtx2Container, sliceKtx2Level, type Ktx2Container } from './ktx2Parse'
import type { DracoDecodedMesh, DracoWasmDecoder } from './dracoBridge'

export type GpuUploadKind = 'texture2d' | 'mesh' | 'deferred'

export interface TextureMipUpload {
  level: number
  width: number
  height: number
  bytes: Uint8Array
  bytesPerRow: number
}

export interface Texture2dUploadPlan {
  kind: 'texture2d'
  id: string
  format: 'rgba8unorm'
  width: number
  height: number
  mipCount: number
  mips: TextureMipUpload[]
  source: 'ktx2-uncompressed'
  container: Ktx2Container
}

export interface MeshAttributeUpload {
  name: string
  array: Float32Array
  itemSize: number
}

export interface MeshUploadPlan {
  kind: 'mesh'
  id: string
  attributes: MeshAttributeUpload[]
  indices?: Uint32Array
  source: 'draco-wasm' | 'gltf-json'
  decoder: 'wasm' | 'stub'
}

export interface DeferredUploadPlan {
  kind: 'deferred'
  id: string
  reason: string
  needs: 'basis-transcoder' | 'draco-wasm' | 'unsupported'
  detail?: Record<string, unknown>
}

export type GpuUploadPlan = Texture2dUploadPlan | MeshUploadPlan | DeferredUploadPlan

function mipSize(base: number, level: number): number {
  return Math.max(1, base >> level)
}

export function planKtx2Upload(id: string, bytes: ArrayBuffer): GpuUploadPlan {
  const container = parseKtx2Container(bytes)
  if (!container.gpuReadyUncompressed) {
    const needs =
      container.supercompression === 'basislz' || container.supercompression === 'zstd'
        ? 'basis-transcoder'
        : 'unsupported'
    return {
      kind: 'deferred',
      id,
      reason: `ktx2 not GPU-ready (vkFormat=${container.vkFormat}, supercompression=${container.supercompression})`,
      needs,
      detail: {
        vkFormat: container.vkFormat,
        supercompression: container.supercompression,
        width: container.width,
        height: container.height,
      },
    }
  }

  const mips: TextureMipUpload[] = container.levels.map((level) => {
    const width = mipSize(container.width, level.level)
    const height = mipSize(container.height, level.level)
    const payload = sliceKtx2Level(bytes, level)
    const expected = width * height * 4
    if (payload.byteLength < expected) {
      throw new Error(`ktx2: level ${level.level} payload ${payload.byteLength} < ${expected}`)
    }
    return {
      level: level.level,
      width,
      height,
      bytes: payload.subarray(0, expected),
      bytesPerRow: width * 4,
    }
  })

  return {
    kind: 'texture2d',
    id,
    format: 'rgba8unorm',
    width: container.width,
    height: container.height,
    mipCount: mips.length,
    mips,
    source: 'ktx2-uncompressed',
    container,
  }
}

export async function planDracoMeshUpload(
  id: string,
  bitstream: ArrayBuffer,
  decoder: DracoWasmDecoder,
  attributes?: Record<string, number>,
): Promise<GpuUploadPlan> {
  if (!decoder.ready) {
    return {
      kind: 'deferred',
      id,
      reason: 'draco WASM decoder not ready',
      needs: 'draco-wasm',
    }
  }
  const mesh: DracoDecodedMesh = await decoder.decode({ bitstream, attributes })
  return {
    kind: 'mesh',
    id,
    attributes: mesh.attributes.map((a) => ({
      name: a.name,
      array: a.data,
      itemSize: a.itemSize,
    })),
    indices: mesh.indices,
    source: 'draco-wasm',
    decoder: mesh.decoder,
  }
}

export function planLoadedAssetUpload(asset: LoadedAsset): GpuUploadPlan {
  if (asset.kind === 'ktx2') return planKtx2Upload(asset.id, asset.bytes)
  if (asset.kind === 'gltf') {
    const hasDraco = asset.meta?.kind === 'gltf' && asset.meta.hasDraco
    return {
      kind: 'deferred',
      id: asset.id,
      reason: hasDraco
        ? 'glTF references KHR_draco_mesh_compression — extract bufferView + planDracoMeshUpload'
        : 'glTF JSON/GLB structural decode only; mesh GPU upload uses Draco bitstream or future GLB accessor path',
      needs: hasDraco ? 'draco-wasm' : 'unsupported',
      detail: asset.meta ? { ...asset.meta } : undefined,
    }
  }
  return {
    kind: 'deferred',
    id: asset.id,
    reason: 'gaussian splat GPU path not enabled',
    needs: 'unsupported',
  }
}
