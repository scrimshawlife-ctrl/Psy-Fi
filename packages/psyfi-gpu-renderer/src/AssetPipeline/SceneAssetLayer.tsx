import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import { AssetLoader } from './AssetLoader'
import { planKtx2UploadAsync } from './uploadPlan'
import { createBasisTranscoder } from './basisTranscoder'
import { normalizeSceneAssets, rgbaPreviewFromPlan } from './sceneAssets'

/**
 * Loads snapshot `assets.ktx2` refs and applies the first GPU-ready texture
 * as a soft ground/tint plane. Procedural scene remains authoritative when
 * no assets are present (current Python default).
 *
 * Uses async BasisLZ transcode when the KTX2 container needs it.
 */
export function SceneAssetLayer({
  snapshot,
  enabled = true,
}: {
  snapshot: SceneSnapshotV1
  enabled?: boolean
}) {
  const refs = useMemo(() => normalizeSceneAssets(snapshot.assets).ktx2, [snapshot.assets])
  const [map, setMap] = useState<THREE.DataTexture | null>(null)
  const [status, setStatus] = useState<string>('idle')

  useEffect(() => {
    if (!enabled || !refs.length) {
      setMap((prev) => {
        prev?.dispose()
        return null
      })
      setStatus(refs.length ? 'disabled' : 'none')
      return
    }

    let cancelled = false
    const loader = new AssetLoader()
    const basis = createBasisTranscoder()
    const primary = refs[0]
    setStatus(`loading ${primary.id}`)

    void (async () => {
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
      } catch (err) {
        if (!cancelled) {
          setStatus(err instanceof Error ? err.message : 'asset error')
          setMap((prev) => {
            prev?.dispose()
            return null
          })
        }
      } finally {
        loader.dispose()
        basis.dispose()
      }
    })()

    return () => {
      cancelled = true
      loader.dispose()
      basis.dispose()
    }
  }, [enabled, refs])

  if (!map) return null

  return (
    <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ assetStatus: status }}>
      <planeGeometry args={[3.2, 3.2]} />
      <meshStandardMaterial map={map} transparent opacity={0.35} depthWrite={false} />
    </mesh>
  )
}
