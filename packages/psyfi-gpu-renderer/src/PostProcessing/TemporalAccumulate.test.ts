import { describe, expect, it } from 'vitest'
import {
  accumulateColor,
  clampHistorySample,
  resolveTemporalPolicy,
} from './TemporalAccumulate'

describe('TemporalAccumulate', () => {
  it('disables history when TAA off or Neutral', () => {
    expect(resolveTemporalPolicy({ enabled: false, neutral: false, motionProxy: 0, safetyAtten: 1 }).damp).toBe(0)
    expect(resolveTemporalPolicy({ enabled: true, neutral: true, motionProxy: 0, safetyAtten: 1 }).damp).toBe(0)
  })

  it('reduces damp under motion and safety attenuation', () => {
    const calm = resolveTemporalPolicy({
      enabled: true,
      neutral: false,
      motionProxy: 0,
      safetyAtten: 1,
      baseDamp: 0.82,
    })
    const moving = resolveTemporalPolicy({
      enabled: true,
      neutral: false,
      motionProxy: 0.8,
      safetyAtten: 1,
      baseDamp: 0.82,
    })
    const clamped = resolveTemporalPolicy({
      enabled: true,
      neutral: false,
      motionProxy: 0,
      safetyAtten: 0.4,
      baseDamp: 0.82,
    })
    expect(calm.damp).toBeGreaterThan(moving.damp)
    expect(calm.damp).toBeGreaterThan(clamped.damp)
    expect(calm.currentWeight).toBeLessThan(1)
  })

  it('clamps history into neighborhood and blends', () => {
    const clamped = clampHistorySample([1, 0, 0], [0.1, 0.1, 0.1], [0.5, 0.5, 0.5])
    expect(clamped[0]).toBe(0.5)
    expect(clamped[1]).toBe(0.1)
    const mixed = accumulateColor([1, 1, 1], [0, 0, 0], 0.25)
    expect(mixed[0]).toBeCloseTo(0.25)
  })
})
