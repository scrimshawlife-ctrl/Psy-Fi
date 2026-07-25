import { describe, expect, it, vi } from 'vitest'
import { AssetLoader, fetchAssetBytes } from './AssetLoader'

function gltfBytes(): ArrayBuffer {
  return new TextEncoder().encode(
    JSON.stringify({
      asset: { version: '2.0' },
      meshes: [{}],
      materials: [],
    }),
  ).buffer
}

describe('AssetLoader G2', () => {
  it('caches fetched bytes on main path and attaches decode meta', async () => {
    const bytes = gltfBytes()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes,
    })
    vi.stubGlobal('fetch', fetchMock)
    const loader = new AssetLoader()
    const a = await loader.load({ id: 'a', kind: 'gltf', url: '/x.gltf' })
    const b = await loader.load({ id: 'a', kind: 'gltf', url: '/x.gltf' })
    expect(a.bytes).toBe(b.bytes)
    expect(a.meta?.kind).toBe('gltf')
    if (a.meta?.kind === 'gltf') {
      expect(a.meta.meshCount).toBe(1)
      expect(a.meta.container).toBe('gltf-json')
    }
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

  it('worker abort removes the message listener so same-id reloads settle', async () => {
    const listeners = new Set<(ev: MessageEvent) => void>()
    const worker = {
      postMessage: vi.fn(),
      addEventListener: (_type: string, fn: (ev: MessageEvent) => void) => {
        listeners.add(fn)
      },
      removeEventListener: (_type: string, fn: (ev: MessageEvent) => void) => {
        listeners.delete(fn)
      },
      terminate: vi.fn(),
    }
    const loader = new AssetLoader({
      mode: 'worker',
      workerFactory: () => worker as unknown as Worker,
    })
    const controller = new AbortController()
    const pending = loader.load({ id: 'same', kind: 'gltf', url: '/x.gltf' }, controller.signal)
    expect(listeners.size).toBe(1)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(listeners.size).toBe(0)
    loader.dispose()
  })
})
