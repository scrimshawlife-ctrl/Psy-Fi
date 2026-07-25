/**
 * Deterministic soft-present raster of a scene snapshot.
 * Used for CI pixel goldens when headless WebGPU is unavailable.
 * Layout mirrors CrystalField + metaballs/ribbons/particles + optional fixture tint.
 * Not a bit-identical stand-in for full R3F/WebGPU stills.
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

function strokeLine(
  rgba: Uint8Array,
  w: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  g: number,
  b: number,
  a: number,
): void {
  const steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    fillCircle(rgba, w, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 1.1, r, g, b, a)
  }
}

function project(pos: [number, number, number], w: number): [number, number, number] {
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

  const mix = neutral ? 0.72 : 0.25 + atten * 0.45
  const grey = 110
  pr = Math.round(pr * (1 - mix) + grey * mix)
  pg = Math.round(pg * (1 - mix) + grey * mix)
  pb = Math.round(pb * (1 - mix) + grey * mix)

  const engines = snapshot.parameter_field.engines || {}

  // Fixture KTX2 ground band — locks SceneAssetLayer wiring into soft goldens.
  const hasKtx2 = (snapshot.assets?.ktx2?.length || 0) > 0
  if (hasKtx2 && !neutral) {
    const y0 = Math.floor(size * 0.78)
    for (let y = y0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const t = (y - y0) / Math.max(1, size - y0)
        setPx(
          rgba,
          size,
          x,
          y,
          Math.min(255, pr + 20),
          Math.min(255, pg + 10),
          Math.max(0, pb - 10),
          Math.round(55 + t * 70),
        )
      }
    }
  }

  if (!neutral) {
    const items = crystalItems(snapshot.procedural.crystals || [], engines)
    for (const it of items) {
      const [x, y, depth] = project(it.position, size)
      const rad = Math.max(1.2, it.scale * size * 2.8)
      const a = Math.round((140 + intensity * 80) * depth)
      fillCircle(rgba, size, x, y, rad, pr, pg, pb, a)
    }

    // Metaball soft disks
    const balls = snapshot.procedural.metaballs || []
    for (let i = 0; i < balls.length; i++) {
      const m = balls[i]
      const seed = Number(m.seed) || i
      const cx = ((Math.sin(seed * 0.41) + 1) * 0.5) * (size - 1)
      const cy = ((Math.cos(seed * 0.27) + 1) * 0.5) * (size - 1)
      const rad = 2.2 + (Number(m.radius) || 0.2) * size * 0.08
      fillCircle(rgba, size, cx, cy, rad, Math.max(0, pr - 30), pg, Math.min(255, pb + 35), 110)
    }

    // Ribbon strokes
    const ribbons = snapshot.procedural.ribbons || []
    for (let i = 0; i < ribbons.length; i++) {
      const rb = ribbons[i]
      const seed = Number(rb.seed) || i
      const x0 = ((Math.sin(seed * 0.13) + 1) * 0.5) * (size - 1)
      const y0 = ((Math.cos(seed * 0.17) + 1) * 0.5) * (size - 1)
      const x1 = ((Math.sin(seed * 0.29 + 1.7) + 1) * 0.5) * (size - 1)
      const y1 = ((Math.cos(seed * 0.23 + 0.9) + 1) * 0.5) * (size - 1)
      strokeLine(rgba, size, x0, y0, x1, y1, pr, Math.min(255, pg + 40), pb, 150)
    }

    // Flow particle dots (budget-capped proxy)
    const flow = engines.flow_field ?? 0
    if (flow > 0.05) {
      const n = Math.min(24, Math.max(4, Math.floor(flow * 28)))
      for (let i = 0; i < n; i++) {
        const a = i * 2.399 + intensity
        const rr = 0.15 + (i % 5) * 0.06
        const [x, y] = project([Math.cos(a) * rr, (i % 4) * 0.05, Math.sin(a) * rr], size)
        fillCircle(rgba, size, x, y, 0.9, pr, pg, pb, 160)
      }
    }

    const glyphs = snapshot.procedural.glyphs || []
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]
      const seed = Number(g.seed) || i
      const x = ((Math.sin(seed * 0.37) + 1) * 0.5) * (size - 1)
      const y = ((Math.cos(seed * 0.19) + 1) * 0.5) * (size - 1)
      fillCircle(rgba, size, x, y, 1.6, Math.min(255, pr + 40), pg, Math.max(0, pb - 20), 200)
    }
  } else {
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
