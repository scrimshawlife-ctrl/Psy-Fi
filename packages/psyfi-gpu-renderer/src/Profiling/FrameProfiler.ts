export interface FrameSample {
  cpuMs: number
  snapshotLagMs: number
  droppedStale: number
  drawCalls: number
}

export interface FrameProfilerSummary {
  sampleCount: number
  avgCpuMs: number
  p95CpuMs: number
  maxCpuMs: number
  fps: number
  targetFrameMs: number
  overBudget: boolean
  overBudgetRatio: number
  latest: FrameSample | null
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

export class FrameProfiler {
  private samples: FrameSample[] = []
  private max = 120

  push(sample: FrameSample): void {
    this.samples.push(sample)
    if (this.samples.length > this.max) this.samples.shift()
  }

  averageCpuMs(): number {
    if (!this.samples.length) return 0
    return this.samples.reduce((a, s) => a + s.cpuMs, 0) / this.samples.length
  }

  maxCpuMs(): number {
    if (!this.samples.length) return 0
    return this.samples.reduce((m, s) => Math.max(m, s.cpuMs), 0)
  }

  p95CpuMs(): number {
    if (!this.samples.length) return 0
    const sorted = this.samples.map((s) => s.cpuMs).sort((a, b) => a - b)
    return percentile(sorted, 95)
  }

  /** Instantaneous FPS estimate from average frame time. */
  fps(): number {
    const avg = this.averageCpuMs()
    if (avg <= 0) return 0
    return 1000 / avg
  }

  latest(): FrameSample | null {
    return this.samples[this.samples.length - 1] || null
  }

  sampleCount(): number {
    return this.samples.length
  }

  summary(targetFrameMs: number): FrameProfilerSummary {
    const avgCpuMs = this.averageCpuMs()
    const p95CpuMs = this.p95CpuMs()
    const maxCpuMs = this.maxCpuMs()
    const overBudgetRatio = targetFrameMs > 0 ? avgCpuMs / targetFrameMs : 0
    return {
      sampleCount: this.samples.length,
      avgCpuMs,
      p95CpuMs,
      maxCpuMs,
      fps: avgCpuMs > 0 ? 1000 / avgCpuMs : 0,
      targetFrameMs,
      overBudget: avgCpuMs > targetFrameMs,
      overBudgetRatio,
      latest: this.latest(),
    }
  }

  reset(): void {
    this.samples = []
  }
}
