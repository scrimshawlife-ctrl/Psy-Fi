import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'

export interface SnapshotStoreStats {
  appliedSequence: number
  droppedStale: number
  pendingSequence: number | null
}

/**
 * Analysis publishes here. Render loop never blocks on fetch —
 * stale sequences are discarded; only newer snapshots are accepted.
 */
export class SnapshotStore {
  private pending: SceneSnapshotV1 | null = null
  private current: SceneSnapshotV1 | null = null
  private appliedSequence = 0
  private droppedStale = 0

  publish(snapshot: SceneSnapshotV1): boolean {
    if (snapshot.sequence <= this.appliedSequence && this.current) {
      this.droppedStale += 1
      return false
    }
    if (this.pending && snapshot.sequence < this.pending.sequence) {
      this.droppedStale += 1
      return false
    }
    this.pending = snapshot
    return true
  }

  /** Called from the render loop — never awaits. */
  takePending(): SceneSnapshotV1 | null {
    if (!this.pending) return null
    const next = this.pending
    this.pending = null
    this.current = next
    this.appliedSequence = next.sequence
    return next
  }

  getCurrent(): SceneSnapshotV1 | null {
    return this.current
  }

  stats(): SnapshotStoreStats {
    return {
      appliedSequence: this.appliedSequence,
      droppedStale: this.droppedStale,
      pendingSequence: this.pending?.sequence ?? null,
    }
  }
}
