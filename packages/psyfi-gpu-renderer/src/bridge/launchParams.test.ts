import { describe, expect, it } from 'vitest'
import { buildGpuLabUrl, readGpuLaunchParams } from './launchParams'

describe('GPU Lab launch params', () => {
  it('reads shell handoff query params and maps shell LOD tiers', () => {
    const p = readGpuLaunchParams(
      '?from=shell&substance=dmt&mode=power&intensity=0.8&seed=99&tier=survival&experience_id=exp_x',
    )
    expect(p.fromShell).toBe(true)
    expect(p.substance).toBe('dmt')
    expect(p.mode).toBe('power')
    expect(p.intensity).toBe(0.8)
    expect(p.seed).toBe(99)
    expect(p.tier).toBe('battery')
    expect(p.experienceId).toBe('exp_x')
  })

  it('maps efficient → balanced and battery_saver → battery', () => {
    expect(readGpuLaunchParams('?tier=efficient').tier).toBe('balanced')
    expect(readGpuLaunchParams('?quality_tier=battery_saver').tier).toBe('battery')
  })

  it('builds a GPU Lab URL from shell controls', () => {
    const url = buildGpuLabUrl({
      substance: 'lsd',
      mode: 'open',
      intensity: 0.75,
      seed: 42,
      qualityTier: 'survival',
      experienceId: 'exp_a',
    })
    expect(url.startsWith('/gpu/?')).toBe(true)
    const q = new URLSearchParams(url.split('?')[1])
    expect(q.get('from')).toBe('shell')
    expect(q.get('substance')).toBe('lsd')
    expect(q.get('tier')).toBe('battery')
    expect(q.get('experience_id')).toBe('exp_a')
  })
})
