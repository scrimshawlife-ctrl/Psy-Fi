/**
 * Deterministic soft-present raster of a scene snapshot.
 * Used for CI pixel goldens when headless WebGPU is unavailable.
 * Layout mirrors CrystalField instance placement + palette/safety intent.
 */

import type { SceneSnapshotV1, ProceduralNode } from '../contracts/SceneSnapshot'
import { PF_CYAN, PF_PAPER } from '../styles/tokens'
import type { PixelFrame } from './pixelTypes'

export const PIXEL_GOLDEN_SIZE = 64

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function parseHexColor(hex: string): [number, number, number] {
  const s = hex.replace('#', '').trim()
  if (s.length >= 6) {
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  }
  return [99, 243, 232]
}

function setPx(rgba: Uint8Array, w: number, x: number, y: number, r: number, g: number, b: number, a = 255): void {
  if (x < 0 || y < 0 || x >= w || y >= w) return
  const o = (y * w + x) * 4
  // Alpha-over
  const sr = r / 255
  const sg = g / 255
  const sb = b / 255
  const sa = a / 255
  const dr = rgba[o] / 255
  const dg = rgba[o + 1] / 255
  const db = rgba[o + 2] / 255
  const da = rgba[o + 3] / 255
  const outA = sa + da * (1 - sa)
  if (outA <= 0) return
  rgba[o] = Math.round(((sr * sa + dr * da * (1 - sa)) / outA) * 255)
  rgba[o + 1] = Math.round(((sg * sa + dg * da * (1 - sa)) / outA) * 255)
  rgba[o + 2] = Math.round(((sb * sa + db * da * (1 - sa)) / outA) * 255)
  rgba[o + 3] = Math.round(outA * 255)
}

function fillCircle(
  rgba: Uint8Array,
  w: number,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  a: number,
): void {
  const r2 = radius * radius
  const x0 = Math.floor(cx - radius)
  const x1 = Math.ceil(cx + radius)
  const y0 = Math.floor(cy - radius)
  const y1 = Math.ceil(cy + radius)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy <= r2) setPx(rgba, w, x, y, r, g, b, a)
    }
  }
}

function project(pos: [number, number, number], w: number): [number, number, number] {
  // Simple orthographic-ish map of CrystalField coords → pixel space
  const x = (pos[0] * 0.85 + 1) * 0.5 * (w - 1)
  const y = (1 - (pos[1] * 1.2 + pos[2] * 0.35 + 1) * 0.5) * (w - 1)
  const depth = clamp01(0.55 + pos[2] * 0.2)
  return [x, y, depth]
}

function crystalItems(nodes: ProceduralNode[], engines: Record<string, number>) {
  const lattice = engines.entity_lattice ?? 0.1
  return nodes.flatMap((n, ni) => {
    const budget = Math.min(48, Number(n.instance_budget) || 32)
    const seed = Number(n.seed) || ni
    const count = Math.max(4, Math.floor(budget * (0.25 + lattice)))
    return Array.from({ length: count }, (_, i) => {
      const a = seed * 0.01 + i * 1.618
      const r = 0.35 + (i % 7) * 0.08
      return {
        position: [Math.cos(a) * r, ((i % 5) - 2) * 0.12, Math.sin(a) * r] as [number, number, number],
        scale: 0.04 + (i % 3) * 0.015,
      }
    })
  })
}

/**
 * Soft-present a snapshot to RGBA8. Applies a light safety attenuator
 * (matches PresentPipeline intent: reduce punch, never bypass).
 */
export function softPresentSnapshot(
  snapshot: SceneSnapshotV1,
  size: number = PIXEL_GOLDEN_SIZE,
): PixelFrame {
  const rgba = new Uint8Array(size * size * 4)
  // Soft-present clear matches design.md paper (PF_PAPER).
  const [paperR, paperG, paperB] = parseHexColor(PF_PAPER)
  for (let i = 0; i < size * size; i++) {
    const o = i * 4
    rgba[o] = paperR
    rgba[o + 1] = paperG
    rgba[o + 2] = paperB
    rgba[o + 3] = 255
  }

  const paletteHex = String(snapshot.parameter_field.palette?.tracers || PF_CYAN)
  let [pr, pg, pb] = parseHexColor(paletteHex)
  const intensity = snapshot.parameter_field.intensity ?? 0.5
  const neutral = !!snapshot.parameter_field.neutral_view
  const safety = snapshot.safety || snapshot.parameter_field.safety || {}
  const atten = clamp01(Number(safety.attenuator ?? safety.max_flash_strength ?? 0.35))

  // Safety: pull toward mid-grey; Neutral: stronger desat
  const mix = neutral ? 0.72 : 0.25 + atten * 0.45
  const grey = 110
  pr = Math.round(pr * (1 - mix) + grey * mix)
  pg = Math.round(pg * (1 - mix) + grey * mix)
  pb = Math.round(pb * (1 - mix) + grey * mix)

  const engines = snapshot.parameter_field.engines || {}
  if (!neutral) {
    const items = crystalItems(snapshot.procedural.crystals || [], engines)
    for (const it of items) {
      const [x, y, depth] = project(it.position, size)
      const rad = Math.max(1.2, it.scale * size * 2.8)
      const a = Math.round((140 + intensity * 80) * depth)
      fillCircle(rgba, size, x, y, rad, pr, pg, pb, a)
    }
    // Glyph accents
    const glyphs = snapshot.procedural.glyphs || []
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]
      const seed = Number(g.seed) || i
      const x = ((Math.sin(seed * 0.37) + 1) * 0.5) * (size - 1)
      const y = ((Math.cos(seed * 0.19) + 1) * 0.5) * (size - 1)
      fillCircle(rgba, size, x, y, 1.6, Math.min(255, pr + 40), pg, Math.max(0, pb - 20), 200)
    }
  } else {
    // Neutral: soft vignette only
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x / size - 0.5) * 2
        const dy = (y / size - 0.5) * 2
        const v = clamp01(1 - Math.sqrt(dx * dx + dy * dy))
        setPx(rgba, size, x, y, 40, 44, 48, Math.round(40 * v))
      }
    }
  }

  return { width: size, height: size, rgba, backend: 'soft' }
}
