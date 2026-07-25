import { createHash } from 'node:crypto'
import type { PixelFrame, PixelGoldenMetrics, PixelHistogram } from './pixelTypes'

const HIST_BINS = 16

export function rgbaHistogram(rgba: Uint8Array): PixelHistogram {
  const bins = new Array(HIST_BINS * 3).fill(0)
  const pixels = Math.floor(rgba.length / 4)
  for (let i = 0; i < pixels; i++) {
    const o = i * 4
    bins[Math.min(HIST_BINS - 1, rgba[o] >> 4)]++
    bins[HIST_BINS + Math.min(HIST_BINS - 1, rgba[o + 1] >> 4)]++
    bins[HIST_BINS * 2 + Math.min(HIST_BINS - 1, rgba[o + 2] >> 4)]++
  }
  return { bins }
}

export function meanRgb(rgba: Uint8Array): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  const pixels = Math.floor(rgba.length / 4) || 1
  for (let i = 0; i < pixels; i++) {
    const o = i * 4
    r += rgba[o]
    g += rgba[o + 1]
    b += rgba[o + 2]
  }
  return [r / pixels, g / pixels, b / pixels]
}

export function sha256Hex(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export function metricsFromFrame(frame: PixelFrame): PixelGoldenMetrics {
  return {
    sha256: sha256Hex(frame.rgba),
    histogram: rgbaHistogram(frame.rgba),
    meanRgb: meanRgb(frame.rgba),
    width: frame.width,
    height: frame.height,
    backend: frame.backend,
  }
}

/** Max L1 distance across histogram bins (absolute counts). */
export function histogramL1(a: PixelHistogram, b: PixelHistogram): number {
  const n = Math.max(a.bins.length, b.bins.length)
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.abs((a.bins[i] || 0) - (b.bins[i] || 0))
  }
  return sum
}
