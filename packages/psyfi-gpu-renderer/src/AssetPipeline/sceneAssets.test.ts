import { describe, expect, it } from 'vitest'
import { makeUncompressedRgba8Ktx2 } from './ktx2Fixture'
import { planKtx2Upload } from './uploadPlan'
import {
  intentsFromLoaded,
  normalizeSceneAssets,
  rgbaPreviewFromPlan,
} from './sceneAssets'

describe('scene asset normalize + upload intents', () => {
  it('normalizes ktx2/gltf refs and drops invalid rows', () => {
    const n = normalizeSceneAssets({
      gltf: [{ id: 'mesh', url: '/a.glb' }, { nope: true }],
      ktx2: [{ id: 'tint', url: '/t.ktx2', role: 'ground' }],
      splats: [],
    })
    expect(n.ktx2).toHaveLength(1)
    expect(n.ktx2[0].role).toBe('ground')
    expect(n.gltf).toHaveLength(1)
    expect(n.all).toHaveLength(2)
  })

  it('marks uncompressed KTX2 intents ready for GPU', () => {
    const bytes = makeUncompressedRgba8Ktx2(2, 2, 1)
    const refs = [{ id: 't', url: '/t.ktx2', kind: 'ktx2' as const }]
    const intents = intentsFromLoaded(refs, [{ id: 't', kind: 'ktx2', bytes }])
    expect(intents[0].ready).toBe(true)
    expect(intents[0].plan.kind).toBe('texture2d')
    const preview = rgbaPreviewFromPlan(intents[0].plan)
    expect(preview?.width).toBe(2)
    expect(preview?.data.byteLength).toBe(16)
  })

  it('empty snapshot assets yield no refs (procedural-only path)', () => {
    const n = normalizeSceneAssets({ gltf: [], ktx2: [], splats: [], images: [] })
    expect(n.all).toHaveLength(0)
    const plan = planKtx2Upload('x', makeUncompressedRgba8Ktx2(4, 4, 1))
    expect(rgbaPreviewFromPlan(plan)?.height).toBe(4)
  })

  it('normalizes image-seed PNG refs ahead of ktx2 in all[]', () => {
    const n = normalizeSceneAssets({
      gltf: [],
      ktx2: [{ id: 'fixture', url: '/t.ktx2' }],
      splats: [],
      images: [{ id: 'image_seed', url: 'data:image/png;base64,aa', role: 'image_seed' }],
    })
    expect(n.images[0].id).toBe('image_seed')
    expect(n.all[0].id).toBe('image_seed')
  })
})
