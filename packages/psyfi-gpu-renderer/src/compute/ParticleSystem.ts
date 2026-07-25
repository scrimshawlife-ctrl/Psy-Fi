import { advectPoint, type FlowParams } from './FlowField'

export interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

export function seedParticles(count: number, seed: number): Particle[] {
  const out: Particle[] = []
  let s = seed >>> 0 || 1
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.2 + rand() * 1.4
    out.push({
      x: Math.cos(a) * r,
      y: (rand() - 0.5) * 1.2,
      z: Math.sin(a) * r,
      vx: 0,
      vy: 0,
      vz: 0,
    })
  }
  return out
}

/** Integrate particles along the flow field; wraps soft bounds. */
export function integrateParticles(particles: Particle[], dt: number, flow: FlowParams): void {
  const damp = 0.92
  for (const p of particles) {
    const [nx, ny, nz] = advectPoint([p.x, p.y, p.z], dt, flow)
    p.vx = (nx - p.x) / Math.max(dt, 1e-4)
    p.vy = (ny - p.y) / Math.max(dt, 1e-4)
    p.vz = (nz - p.z) / Math.max(dt, 1e-4)
    p.x = nx
    p.y = ny
    p.z = nz
    p.vx *= damp
    p.vy *= damp
    p.vz *= damp
    // Soft wrap to keep density in view
    const lim = 2.4
    if (p.x > lim) p.x -= lim * 2
    if (p.x < -lim) p.x += lim * 2
    if (p.z > lim) p.z -= lim * 2
    if (p.z < -lim) p.z += lim * 2
    if (p.y > lim) p.y = lim
    if (p.y < -lim) p.y = -lim
  }
}

export function particleBudgetForTier(particleBudget: number, intensity: number): number {
  const scaled = Math.floor(particleBudget * (0.15 + intensity * 0.55))
  const clamped = Math.max(64, Math.min(particleBudget, scaled))
  // Quantize so snapshot intensity lerps do not rebuild GPU compute pipelines every frame.
  const step = Math.max(32, Math.floor(particleBudget / 16))
  return Math.max(64, Math.min(particleBudget, Math.round(clamped / step) * step))
}
