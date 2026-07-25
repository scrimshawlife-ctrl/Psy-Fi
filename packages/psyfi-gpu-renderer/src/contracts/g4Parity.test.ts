import { describe, expect, it } from 'vitest'
import { G4_PARITY_ROWS, G4_VISUAL_SEEDS, parityHasUnknown, parityShipBlockers } from './g4Parity'

describe('G4 parity matrix', () => {
  it('has no empty capability rows and no ship blockers', () => {
    expect(G4_PARITY_ROWS.length).toBeGreaterThanOrEqual(6)
    expect(parityHasUnknown()).toBe(false)
    expect(parityShipBlockers()).toEqual([])
  })

  it('lists canonical visual seeds for goldens', () => {
    expect(G4_VISUAL_SEEDS.length).toBeGreaterThanOrEqual(3)
    for (const s of G4_VISUAL_SEEDS) {
      expect(s.seed).toBeTypeOf('number')
      expect(s.substance.length).toBeGreaterThan(0)
    }
  })
})
