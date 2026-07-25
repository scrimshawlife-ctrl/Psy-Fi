import { describe, expect, it } from 'vitest'
import {
  clearImageSeedHandoff,
  readImageSeedHandoff,
  writeImageSeedHandoff,
  IMAGE_SEED_STORAGE_KEY,
} from './imageSeedHandoff'

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
}

describe('image seed handoff', () => {
  it('round-trips session payload', () => {
    const mem = new MemoryStorage() as unknown as Storage
    // write uses real sessionStorage when present — exercise read/clear helpers
    mem.setItem(
      IMAGE_SEED_STORAGE_KEY,
      JSON.stringify({
        schema: 'psyfi.imageSeed.v1',
        master_seed: 99,
        influence: 0.5,
        parameter_hints: { palette_energy: 0.1 },
      }),
    )
    const doc = readImageSeedHandoff(mem)
    expect(doc?.master_seed).toBe(99)
    expect(doc?.parameter_hints?.palette_energy).toBe(0.1)
    clearImageSeedHandoff(mem)
    expect(readImageSeedHandoff(mem)).toBeNull()
  })

  it('rejects bad schema', () => {
    const mem = new MemoryStorage() as unknown as Storage
    mem.setItem(IMAGE_SEED_STORAGE_KEY, JSON.stringify({ schema: 'nope', master_seed: 1 }))
    expect(readImageSeedHandoff(mem)).toBeNull()
  })
})
