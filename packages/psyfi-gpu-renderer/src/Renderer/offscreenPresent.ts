/**
 * OffscreenCanvas present-mode scaffold (ROADMAP G1).
 * Same-thread transfer only — Worker remoting stays deferred.
 */

export type OffscreenPresentMode = 'main' | 'offscreen-requested' | 'offscreen-unsupported'

export interface OffscreenPresentCaps {
  /** Transfer API present. */
  canTransfer: boolean
  /** Prefer staying on main (battery / reduced motion). */
  preferMain: boolean
}

export function probeOffscreenCaps(
  globalObj: typeof globalThis = globalThis,
): OffscreenPresentCaps {
  const g = globalObj as typeof globalThis & {
    OffscreenCanvas?: unknown
    HTMLCanvasElement?: { prototype?: { transferControlToOffscreen?: unknown } }
    matchMedia?: (q: string) => { matches: boolean }
  }
  const canTransfer =
    typeof g.OffscreenCanvas !== 'undefined' &&
    typeof g.HTMLCanvasElement?.prototype?.transferControlToOffscreen === 'function'
  const preferMain = !!g.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  return { canTransfer, preferMain }
}

export function resolveOffscreenPresentMode(opts: {
  requested?: boolean
  caps?: OffscreenPresentCaps
}): OffscreenPresentMode {
  if (!opts.requested) return 'main'
  const caps = opts.caps ?? probeOffscreenCaps()
  if (caps.preferMain) return 'main'
  if (!caps.canTransfer) return 'offscreen-unsupported'
  return 'offscreen-requested'
}

/**
 * Attempt transferControlToOffscreen. Returns null when unsupported or on failure.
 * Caller owns the source canvas element (must not already be transferred).
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
