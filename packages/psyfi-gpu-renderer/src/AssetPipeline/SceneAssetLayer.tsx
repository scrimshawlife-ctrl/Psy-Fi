import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import { AssetLoader } from './AssetLoader'
import { planKtx2UploadAsync } from './uploadPlan'
import { createBasisTranscoder } from './basisTranscoder'
import { isPngOrDataUrl, normalizeSceneAssets, rgbaPreviewFromPlan } from './sceneAssets'

/**
 * Loads snapshot texture refs and applies soft ground/tint.
 * Prefers ephemeral `assets.images` (conditioned image seed PNG/data-URL),
 * then falls back to KTX2 fixtures/packs. Procedural scene stays authoritative.
 */
export function SceneAssetLayer({
  snapshot,
  enabled = true,
}: {
  snapshot: SceneSnapshotV1
  enabled?: boolean
}) {
  const normalized = useMemo(() => normalizeSceneAssets(snapshot.assets), [snapshot.assets])
  const primary = useMemo(() => {
    const img = normalized.images[0]
    if (img) return { ...img, source: 'image' as const }
    const ktx = normalized.ktx2[0]
    if (ktx) return { ...ktx, source: 'ktx2' as const }
    return null
  }, [normalized])
  const [map, setMap] = useState<THREE.Texture | null>(null)
  const [status, setStatus] = useState<string>('idle')

  useEffect(() => {
    if (!enabled || !primary) {
      setMap((prev) => {
        prev?.dispose()
        return null
      })
      setStatus(primary ? 'disabled' : 'none')
      return
    }

    let cancelled = false
    setStatus(`loading ${primary.id}`)

    void (async () => {
      try {
        if (primary.source === 'image' || isPngOrDataUrl(primary.url)) {
          const tex = await new Promise<THREE.Texture>((resolve, reject) => {
            const loader = new THREE.TextureLoader()
            loader.load(
              primary.url,
              (t) => {
                t.colorSpace = THREE.SRGBColorSpace
                t.needsUpdate = true
                resolve(t)
              },
              undefined,
              (err) => reject(err instanceof Error ? err : new Error('png load failed')),
            )
          })
          if (cancelled) {
            tex.dispose()
            return
          }
          setMap((prev) => {
            prev?.dispose()
            return tex
          })
          setStatus(`ready ${primary.id}`)
          return
        }

        const loader = new AssetLoader()
        const basis = createBasisTranscoder()
        try {
          const asset = await loader.load({ id: primary.id, kind: 'ktx2', url: primary.url })
          if (cancelled) return
          const plan = await planKtx2UploadAsync(asset.id, asset.bytes, basis)
          const preview = rgbaPreviewFromPlan(plan)
          if (!preview) {
            setStatus(plan.kind === 'deferred' ? `deferred:${plan.needs}` : 'no-preview')
            setMap((prev) => {
              prev?.dispose()
              return null
            })
            return
          }
          const tex = new THREE.DataTexture(
            preview.data,
            preview.width,
            preview.height,
            THREE.RGBAFormat,
          )
          tex.needsUpdate = true
          tex.colorSpace = THREE.SRGBColorSpace
          if (cancelled) {
            tex.dispose()
            return
          }
          setMap((prev) => {
            prev?.dispose()
            return tex
          })
          setStatus(`ready ${primary.id}`)
        } finally {
          loader.dispose()
          basis.dispose()
        }
      } catch (err) {
        if (!cancelled) {
          setStatus(err instanceof Error ? err.message : 'asset error')
          setMap((prev) => {
            prev?.dispose()
            return null
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, primary])

  if (!map) return null

  return (
    <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ assetStatus: status }}>
      <planeGeometry args={[3.2, 3.2]} />
      <meshStandardMaterial map={map} transparent opacity={0.35} depthWrite={false} />
    </mesh>
  )
}
