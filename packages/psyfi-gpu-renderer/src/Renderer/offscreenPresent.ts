/**
 * OffscreenCanvas present-mode scaffold.
 * Same-thread transfer + worker remoting mode resolution.
 * Worker-owned WebGPU present remains deferred.
 */

export type OffscreenPresentMode =
  | 'main'
  | 'offscreen-requested'
  | 'offscreen-unsupported'
  | 'worker-remoting'
  | 'worker-unsupported'

export interface OffscreenPresentCaps {
  /** Transfer API present. */
  canTransfer: boolean
  /** Worker constructor available. */
  canWorker: boolean
  /** Prefer staying on main (battery / reduced motion). */
  preferMain: boolean
}

export function probeOffscreenCaps(
  globalObj: typeof globalThis = globalThis,
): OffscreenPresentCaps {
  const g = globalObj as typeof globalThis & {
    OffscreenCanvas?: unknown
    Worker?: unknown
    HTMLCanvasElement?: { prototype?: { transferControlToOffscreen?: unknown } }
    matchMedia?: (q: string) => { matches: boolean }
  }
  const canTransfer =
    typeof g.OffscreenCanvas !== 'undefined' &&
    typeof g.HTMLCanvasElement?.prototype?.transferControlToOffscreen === 'function'
  const canWorker = typeof g.Worker !== 'undefined'
  const preferMain = !!g.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  return { canTransfer, canWorker, preferMain }
}

export function resolveOffscreenPresentMode(opts: {
  requested?: boolean
  /** Prefer dedicated present worker over same-thread OffscreenCanvas. */
  preferWorker?: boolean
  caps?: OffscreenPresentCaps
}): OffscreenPresentMode {
  if (!opts.requested) return 'main'
  const caps = opts.caps ?? probeOffscreenCaps()
  if (caps.preferMain) return 'main'
  if (opts.preferWorker) {
    if (!caps.canWorker) return 'worker-unsupported'
    // Protocol ready; production still falls back until worker owns WebGPU.
    return 'worker-remoting'
  }
  if (!caps.canTransfer) return 'offscreen-unsupported'
  return 'offscreen-requested'
}

/**
 * Attempt transferControlToOffscreen. Returns null when unsupported or on failure.
 */
export function tryTransferToOffscreen(
  canvas: HTMLCanvasElement,
): OffscreenCanvas | null {
  try {
    if (typeof canvas.transferControlToOffscreen !== 'function') return null
    return canvas.transferControlToOffscreen()
  } catch {
    return null
  }
}
