import { describe, expect, it } from 'vitest'
import { advectPoint, sampleFlow } from './FlowField'
import { integrateParticles, particleBudgetForTier, seedParticles } from './ParticleSystem'
import { cullInstances } from './InstanceCull'
import { lodScale, selectLod } from './LodSelect'

describe('G2 compute kernels', () => {
  it('flow sample is finite and intensity increases amplitude', () => {
    const lo = sampleFlow(0.2, 0.1, -0.3, {
      turbulence: 0.1,
      intensity: 0.2,
      peripheralFlow: 0.1,
      time: 1,
    })
    const hi = sampleFlow(0.2, 0.1, -0.3, {
      turbulence: 0.1,
      intensity: 0.9,
      peripheralFlow: 0.1,
      time: 1,
    })
    const mag = (v: [number, number, number]) => Math.hypot(v[0], v[1], v[2])
    expect(mag(lo)).toBeGreaterThan(0)
    expect(mag(hi)).toBeGreaterThan(mag(lo))
  })

  it('advection is deterministic for fixed seed params', () => {
    const a = advectPoint([0.5, 0, -0.5], 1 / 60, {
      turbulence: 0.3,
      intensity: 0.7,
      peripheralFlow: 0.4,
      time: 2.5,
    })
    const b = advectPoint([0.5, 0, -0.5], 1 / 60, {
      turbulence: 0.3,
      intensity: 0.7,
      peripheralFlow: 0.4,
      time: 2.5,
    })
    expect(a).toEqual(b)
  })

  it('particle integrate moves the cloud and respects budget helper', () => {
    const parts = seedParticles(128, 42)
    const before = parts.map((p) => p.x + p.y + p.z)
    integrateParticles(parts, 1 / 30, {
      turbulence: 0.5,
      intensity: 0.8,
      peripheralFlow: 0.6,
      time: 3,
    })
    const moved = parts.some((p, i) => p.x + p.y + p.z !== before[i])
    expect(moved).toBe(true)
    expect(particleBudgetForTier(48_000, 0.5)).toBeLessThanOrEqual(48_000)
    expect(particleBudgetForTier(12_000, 0.1)).toBeGreaterThanOrEqual(64)
  })

  it('cull drops far spheres and keeps near', () => {
    const items = [
      { x: 0, y: 0, z: 0, radius: 0.1 },
      { x: 50, y: 0, z: 0, radius: 0.1 },
    ]
    const vis = cullInstances(items, { x: 0, y: 0, z: 2 }, 10)
    expect(vis).toEqual([0])
  })

  it('lod steps with distance and draw budget', () => {
    expect(selectLod(0.5, { near: 1, mid: 3, far: 8, drawBudget: 40, drawIndex: 0 })).toBe(0)
    expect(selectLod(2, { near: 1, mid: 3, far: 8, drawBudget: 40, drawIndex: 0 })).toBe(1)
    expect(selectLod(5, { near: 1, mid: 3, far: 8, drawBudget: 40, drawIndex: 0 })).toBe(2)
    expect(selectLod(0.2, { near: 1, mid: 3, far: 8, drawBudget: 2, drawIndex: 2 })).toBe(2)
    expect(lodScale(0)).toBeGreaterThan(lodScale(2))
  })
})
