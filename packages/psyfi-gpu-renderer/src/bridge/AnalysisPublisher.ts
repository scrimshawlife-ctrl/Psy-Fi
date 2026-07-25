import { assertSceneSnapshot, type SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { SnapshotStore } from './SnapshotStore'

export interface PublishOptions {
  substance?: string
  mode?: string
  intensity?: number
  seed?: number
  quality_tier?: string
  experience_id?: string | null
  include_simulation?: boolean
  include_fixture_assets?: boolean
  reduce_motion?: boolean
  dim_flashing?: boolean
  neutral_view?: boolean
  apiBase?: string
}

/**
 * Async analysis client. Camera acquisition must NOT await this.
 * Publishes immutable snapshots into SnapshotStore; render loop pulls.
 */
export class AnalysisPublisher {
  private sequence = 0
  private inFlight: AbortController | null = null

  constructor(private readonly store: SnapshotStore, private readonly apiBase = '') {}

  async publish(opts: PublishOptions = {}): Promise<SceneSnapshotV1 | null> {
    // Cancel prior in-flight analysis — never queue behind stale work.
    if (this.inFlight) this.inFlight.abort()
    const ac = new AbortController()
    this.inFlight = ac
    this.sequence += 1
    const sequence = this.sequence

    const body = {
      substance: opts.substance ?? 'lsd',
      mode: opts.mode ?? 'open',
      intensity: opts.intensity ?? 0.7,
      seed: opts.seed ?? 42,
      quality_tier: opts.quality_tier ?? 'balanced',
      experience_id: opts.experience_id ?? null,
      include_simulation: opts.include_simulation ?? true,
      include_fixture_assets: !!opts.include_fixture_assets,
      reduce_motion: !!opts.reduce_motion,
      dim_flashing: !!opts.dim_flashing,
      neutral_view: !!opts.neutral_view,
      sequence,
      steps: 12,
      sim_steps: 4,
    }

    try {
      const res = await fetch(`${opts.apiBase ?? this.apiBase}/api/v1/visualize/scene-snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      assertSceneSnapshot(data)
      this.store.publish(data)
      return data
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null
      throw err
    } finally {
      if (this.inFlight === ac) this.inFlight = null
    }
  }
}
