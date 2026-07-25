import { describe, expect, it, vi } from 'vitest'
import {
  probeOffscreenCaps,
  resolveOffscreenPresentMode,
  tryTransferToOffscreen,
} from './offscreenPresent'

describe('offscreen present mode', () => {
  it('defaults to main when not requested', () => {
    expect(resolveOffscreenPresentMode({ requested: false })).toBe('main')
  })

  it('reports unsupported when transfer API is missing', () => {
    expect(
      resolveOffscreenPresentMode({
        requested: true,
        caps: { canTransfer: false, preferMain: false },
      }),
    ).toBe('offscreen-unsupported')
  })

  it('stays on main when reduced-motion prefers main', () => {
    expect(
      resolveOffscreenPresentMode({
        requested: true,
        caps: { canTransfer: true, preferMain: true },
      }),
    ).toBe('main')
  })

  it('requests offscreen when capable', () => {
    expect(
      resolveOffscreenPresentMode({
        requested: true,
        caps: { canTransfer: true, preferMain: false },
      }),
    ).toBe('offscreen-requested')
  })

  it('probeOffscreenCaps reflects missing APIs in Node', () => {
    const caps = probeOffscreenCaps()
    // Node vitest has no HTMLCanvasElement transfer.
    expect(caps.canTransfer).toBe(false)
  })

  it('tryTransferToOffscreen calls transfer once', () => {
    const off = {} as OffscreenCanvas
    const canvas = {
      transferControlToOffscreen: vi.fn(() => off),
    } as unknown as HTMLCanvasElement
    expect(tryTransferToOffscreen(canvas)).toBe(off)
    expect(canvas.transferControlToOffscreen).toHaveBeenCalledTimes(1)
  })

  it('tryTransferToOffscreen returns null when API missing', () => {
    const canvas = {} as HTMLCanvasElement
    expect(tryTransferToOffscreen(canvas)).toBeNull()
  })
})
