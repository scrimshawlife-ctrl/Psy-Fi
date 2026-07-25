import { describe, expect, it, vi } from 'vitest'
import { AssetLoader, fetchAssetBytes } from './AssetLoader'

describe('AssetLoader G2', () => {
  it('caches fetched bytes on main path', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes,
    })
    vi.stubGlobal('fetch', fetchMock)
    const loader = new AssetLoader()
    const a = await loader.load({ id: 'a', kind: 'gltf', url: '/x.glb' })
    const b = await loader.load({ id: 'a', kind: 'gltf', url: '/x.glb' })
    expect(a.bytes).toBe(b.bytes)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(loader.loadMode).toBe('main')
    vi.unstubAllGlobals()
  })

  it('fetchAssetBytes rejects non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    )
    await expect(fetchAssetBytes('/missing')).rejects.toThrow(/404/)
    vi.unstubAllGlobals()
  })
})
