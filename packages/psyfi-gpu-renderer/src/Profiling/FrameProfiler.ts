export interface FrameSample {
  cpuMs: number
  snapshotLagMs: number
  droppedStale: number
  drawCalls: number
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

  latest(): FrameSample | null {
    return this.samples[this.samples.length - 1] || null
  }

  reset(): void {
    this.samples = []
  }
}
