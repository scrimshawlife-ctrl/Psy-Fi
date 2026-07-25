/**
 * Full R3F WebGPU still capture orchestrator.
 * CI without a GPU runner returns soft-present + mode `r3f-deferred`.
 * A future GPU CI harness can flip to `r3f-webgpu` without changing callers.
 */

import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { CaptureMode, CapturePixelResult } from './webgpuCapture'
import { PIXEL_GOLDEN_SIZE, softPresentSnapshot } from './softPresent'

export type R3fStillMode = Extract<CaptureMode, 'soft' | 'r3f-deferred' | 'r3f-webgpu'>

export interface R3fStillOptions {
  size?: number
  /** CI default: true — never attempt GPU SceneRoot stills. */
  preferSoft?: boolean
  /** When true and no harness/GPU, still returns soft with mode r3f-deferred. */
  requireGpuCi?: boolean
}

export interface R3fStillResult extends CapturePixelResult {
  mode: R3fStillMode
  detail?: string
}

/** Probe whether a full R3F still harness is available (GPU CI only today). */
export function r3fStillHarnessAvailable(
  globalObj: typeof globalThis = globalThis,
): boolean {
  const g = globalObj as typeof globalThis & {
    navigator?: { gpu?: unknown }
    __PSYFI_R3F_STILL_HARNESS__?: boolean
  }
  return !!g.__PSYFI_R3F_STILL_HARNESS__ && !!g.navigator?.gpu
}

/**
 * Capture an R3F still when a GPU CI harness is injected; otherwise soft-present.
 * Never throws — callers always get pixels + an explicit mode.
 */
export async function captureR3fStill(
  snapshot: SceneSnapshotV1,
  opts: R3fStillOptions = {},
): Promise<R3fStillResult> {
  const size = opts.size ?? PIXEL_GOLDEN_SIZE
  const preferSoft = opts.preferSoft !== false

  if (preferSoft) {
    const soft = softPresentSnapshot(snapshot, size)
    return { ...soft, mode: 'soft', detail: 'preferSoft' }
  }

  if (!r3fStillHarnessAvailable()) {
    const soft = softPresentSnapshot(snapshot, size)
    return {
      ...soft,
      mode: 'r3f-deferred',
      detail: opts.requireGpuCi ? 'gpu-ci-harness-required' : 'no-gpu-ci-harness',
    }
  }

  // Future: harness mounts SceneRoot → readback. Until then keep soft pixels
  // but advertise deferred so goldens never lock a false r3f-webgpu SHA.
  const soft = softPresentSnapshot(snapshot, size)
  return { ...soft, mode: 'r3f-deferred', detail: 'harness-stub' }
}
