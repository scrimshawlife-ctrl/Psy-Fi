import { describe, expect, it } from 'vitest'
import { FrameProfiler } from './FrameProfiler'

describe('FrameProfiler', () => {
  it('computes avg, p95, max, and fps from samples', () => {
    const profiler = new FrameProfiler()
    for (let i = 1; i <= 20; i++) {
      profiler.push({ cpuMs: i, snapshotLagMs: 1, droppedStale: 0, drawCalls: 10 })
    }
    expect(profiler.averageCpuMs()).toBeCloseTo(10.5, 5)
    expect(profiler.maxCpuMs()).toBe(20)
    expect(profiler.p95CpuMs()).toBeGreaterThanOrEqual(19)
    expect(profiler.fps()).toBeCloseTo(1000 / 10.5, 5)
  })

  it('summary flags over-budget frames against target', () => {
    const profiler = new FrameProfiler()
    for (let i = 0; i < 10; i++) {
      profiler.push({ cpuMs: 20, snapshotLagMs: 0, droppedStale: 0, drawCalls: 40 })
    }
    const ok = profiler.summary(16.7)
    expect(ok.overBudget).toBe(true)
    expect(ok.overBudgetRatio).toBeGreaterThan(1)
    expect(ok.sampleCount).toBe(10)
    expect(ok.targetFrameMs).toBe(16.7)

    const healthy = new FrameProfiler()
    for (let i = 0; i < 10; i++) {
      healthy.push({ cpuMs: 8, snapshotLagMs: 0, droppedStale: 0, drawCalls: 20 })
    }
    const sum = healthy.summary(16.7)
    expect(sum.overBudget).toBe(false)
    expect(sum.fps).toBeGreaterThan(100)
  })

  it('handles empty profiler safely', () => {
    const profiler = new FrameProfiler()
    expect(profiler.averageCpuMs()).toBe(0)
    expect(profiler.fps()).toBe(0)
    expect(profiler.summary(16.7).sampleCount).toBe(0)
    expect(profiler.latest()).toBeNull()
  })
})
