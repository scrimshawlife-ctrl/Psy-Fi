/**
 * Camera acquisition is fully decoupled from symbolic analysis.
 * Only publishes normalized meters for ParameterField modulators.
 */
export type CameraMeterListener = (energy: number) => void

export class CameraPipeline {
  private stream: MediaStream | null = null
  private raf = 0
  private listeners = new Set<CameraMeterListener>()

  subscribe(fn: CameraMeterListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API unavailable')
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    const video = document.createElement('video')
    video.srcObject = this.stream
    video.playsInline = true
    await video.play()
    const meter = document.createElement('canvas')
    meter.width = 32
    meter.height = 32
    const ctx = meter.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const tick = () => {
      if (!this.stream) return
      ctx.drawImage(video, 0, 0, 32, 32)
      const px = ctx.getImageData(0, 0, 32, 32).data
      let sum = 0
      for (let i = 0; i < px.length; i += 4) sum += (px[i] + px[i + 1] + px[i + 2]) / 3
      const energy = Math.min(1, sum / (255 * (px.length / 4)))
      this.listeners.forEach((fn) => fn(energy))
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}
