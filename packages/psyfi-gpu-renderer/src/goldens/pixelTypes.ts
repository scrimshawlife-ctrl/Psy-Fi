/** Shared types for /gpu/ pixel goldens (soft-present CI + optional WebGPU capture). */

export type PixelBackend = 'soft' | 'webgpu'

export interface PixelFrame {
  width: number
  height: number
  /** RGBA8 tightly packed */
  rgba: Uint8Array
  backend: PixelBackend
}

export interface PixelHistogram {
  /** 16 bins per channel (R,G,B) — length 48 */
  bins: number[]
}

export interface PixelGoldenMetrics {
  sha256: string
  histogram: PixelHistogram
  meanRgb: [number, number, number]
  width: number
  height: number
  backend: PixelBackend
}

export interface PixelGoldenCase {
  key: string
  substance: string
  mode: string
  seed: number
  intensity: number
  metrics: PixelGoldenMetrics
}
