import { describe, expect, it, vi } from 'vitest'
import { disposePresentResources } from './presentDispose'

describe('disposePresentResources', () => {
  it('disposes resources in reverse order and ignores dispose throws', () => {
    const order: string[] = []
    const a = {
      dispose: () => {
        order.push('a')
      },
    }
    const b = {
      dispose: () => {
        order.push('b')
        throw new Error('lost')
      },
    }
    const c = {
      dispose: () => {
        order.push('c')
      },
    }
    disposePresentResources([a, b, c])
    expect(order).toEqual(['c', 'b', 'a'])
  })

  it('skips resources without dispose', () => {
    const dispose = vi.fn()
    disposePresentResources([{}, { dispose }, { dispose: undefined }])
    expect(dispose).toHaveBeenCalledOnce()
  })
})
