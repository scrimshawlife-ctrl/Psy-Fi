import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

/**
 * Smoothly approaches the newest accepted snapshot without stalling.
 * Discrete procedural topology switches on target change; continuous
 * fields (camera, intensity-like params) interpolate.
 */
export class SnapshotInterpolator {
  private from: SceneSnapshotV1 | null = null
  private to: SceneSnapshotV1 | null = null
  private t = 1
  private speed = 4 // approach rate

  setTarget(snapshot: SceneSnapshotV1): void {
    this.from = this.sample() || snapshot
    this.to = snapshot
    this.t = 0
  }

  /** Jump to the current target with no interpolation (reduced-motion). */
  snap(): SceneSnapshotV1 | null {
    this.t = 1
    this.from = this.to
    return this.sample()
  }

  tick(dt: number): SceneSnapshotV1 | null {
    if (!this.to) return null
    this.t = Math.min(1, this.t + dt * this.speed)
    return this.sample()
  }

  sample(): SceneSnapshotV1 | null {
    if (!this.to) return null
    if (!this.from || this.t >= 1) return this.to
    const a = this.from
    const b = this.to
    const u = this.t * this.t * (3 - 2 * this.t)
    return {
      ...b,
      camera: {
        ...b.camera,
        position: lerp3(a.camera.position, b.camera.position, u),
        target: lerp3(a.camera.target, b.camera.target, u),
        fov_deg: lerp(a.camera.fov_deg, b.camera.fov_deg, u),
        exposure: lerp(a.camera.exposure, b.camera.exposure, u),
      },
      parameter_field: {
        ...b.parameter_field,
        intensity: lerp(a.parameter_field.intensity, b.parameter_field.intensity, u),
      },
    }
  }
}
