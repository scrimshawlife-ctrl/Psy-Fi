import { describe, expect, it } from 'vitest'
import { attachPackAssets, normalizePackManifest, refsFromPack } from './assetPacks'

describe('asset pack manifests', () => {
  it('normalizes empty stub pack', () => {
    const pack = normalizePackManifest({
      schema: 'psyfi.asset_pack.v1',
      id: 'empty_stub',
      version: '0.0.0',
      procedural_fallback: true,
      status: 'stub',
      gltf: [],
      ktx2: [],
      splats: [],
    })
    expect(pack?.id).toBe('empty_stub')
    expect(refsFromPack(pack).length).toBe(0)
    expect(pack?.procedural_fallback).toBe(true)
  })

  it('collects ktx2/gltf refs and drops invalid rows', () => {
    const pack = normalizePackManifest({
      schema: 'psyfi.asset_pack.v1',
      id: 'proto',
      version: '0.1.0',
      procedural_fallback: true,
      status: 'draft',
      gltf: [{ id: 'm', url: '/gpu/assets/packs/m.glb' }, { nope: true }],
      ktx2: [{ id: 't', url: '/gpu/assets/packs/t.ktx2', role: 'ground' }],
      splats: [],
    })
    expect(refsFromPack(pack).map((r) => r.id)).toEqual(['t', 'm'])
  })

  it('rejects unknown schema / missing id', () => {
    expect(normalizePackManifest({ schema: 'other', id: 'x' })).toBeNull()
    expect(normalizePackManifest({ schema: 'psyfi.asset_pack.v1', id: '' })).toBeNull()
  })

  it('attachPackAssets merges without duplicating ids', () => {
    const pack = normalizePackManifest({
      schema: 'psyfi.asset_pack.v1',
      id: 'proto',
      status: 'draft',
      ktx2: [
        { id: 'a', url: '/a.ktx2' },
        { id: 'b', url: '/b.ktx2' },
      ],
      gltf: [],
      splats: [],
    })
    const out = attachPackAssets({ ktx2: [{ id: 'a', url: '/keep.ktx2' }], gltf: [], splats: [] }, pack)
    expect(out.ktx2.map((r) => r.id)).toEqual(['a', 'b'])
    expect(out.ktx2[0].url).toBe('/keep.ktx2')
  })
})
