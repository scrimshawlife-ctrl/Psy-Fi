/**
 * Optional hardware WebGPU pixel capture.
 * Falls back to soft-present when adapter/device is unavailable (CI default).
 */

import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { PixelFrame } from './pixelTypes'
import { PIXEL_GOLDEN_SIZE, softPresentSnapshot } from './softPresent'

function parseHexColor(hex: string): [number, number, number] {
  const s = String(hex || '#3ee7f2').replace('#', '')
  return [parseInt(s.slice(0, 2), 16) || 99, parseInt(s.slice(2, 4), 16) || 243, parseInt(s.slice(4, 6), 16) || 232]
}

const TEX_COPY_SRC = 0x01
const TEX_RENDER = 0x10
const BUF_MAP_READ = 0x0001
const BUF_COPY_DST = 0x0008
const MAP_READ = 0x0001

/**
 * Minimal WebGPU clear → readback using the snapshot palette as clear color.
 * Full R3F scene capture is out of scope for headless CI; this validates the
 * WebGPU readback path when an adapter exists. Soft-present remains the
 * deterministic golden for scene structure.
 */
export async function webgpuPaletteClearCapture(
  snapshot: SceneSnapshotV1,
  size: number = PIXEL_GOLDEN_SIZE,
): Promise<PixelFrame | null> {
  const gpu = typeof navigator !== 'undefined' ? navigator.gpu : undefined
  if (!gpu?.requestAdapter) return null
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) return null
    const device = await adapter.requestDevice()
    const [r, g, b] = parseHexColor(String(snapshot.parameter_field.palette?.tracers || '#3ee7f2'))
    const texture = device.createTexture({
      size: { width: size, height: size },
      format: 'rgba8unorm',
      usage: TEX_RENDER | TEX_COPY_SRC,
    })
    const bufSize = size * size * 4
    const buffer = device.createBuffer({
      size: bufSize,
      usage: BUF_COPY_DST | BUF_MAP_READ,
    })
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: texture.createView(),
          clearValue: { r: r / 255, g: g / 255, b: b / 255, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })
    pass.end()
    encoder.copyTextureToBuffer(
      { texture },
      { buffer, bytesPerRow: size * 4 },
      { width: size, height: size },
    )
    device.queue.submit([encoder.finish()])
    await buffer.mapAsync(MAP_READ)
    const rgba = new Uint8Array(buffer.getMappedRange().slice(0))
    buffer.unmap()
    texture.destroy()
    buffer.destroy()
    device.destroy()
    return { width: size, height: size, rgba, backend: 'webgpu' }
  } catch {
    return null
  }
}

export interface CapturePixelOptions {
  size?: number
  /** Prefer soft even if WebGPU exists (CI default). */
  preferSoft?: boolean
  /** Also attempt WebGPU palette clear when available. */
  tryWebGpu?: boolean
}

/**
 * Capture pixels for golden comparison.
 * Default: soft-present (deterministic, CI-safe).
 * Set tryWebGpu + preferSoft=false to exercise hardware path locally.
 */
export async function capturePixelFrame(
  snapshot: SceneSnapshotV1,
  opts: CapturePixelOptions = {},
): Promise<PixelFrame> {
  const size = opts.size ?? PIXEL_GOLDEN_SIZE
  const preferSoft = opts.preferSoft !== false
  if (!preferSoft && opts.tryWebGpu) {
    const hw = await webgpuPaletteClearCapture(snapshot, size)
    if (hw) return hw
  }
  return softPresentSnapshot(snapshot, size)
}
