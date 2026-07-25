import { useMemo } from 'react'
import * as THREE from 'three'
import type { MagnitudeField } from '../contracts/SceneSnapshot'

/** Optional sim magnitude as a soft source plane — never ParameterField authority. */
export function MagnitudePlane({ field, mix }: { field: MagnitudeField; mix: number }) {
  const texture = useMemo(() => {
    const { width, height, values } = field
    const data = new Uint8Array(width * height * 4)
    for (let y = 0; y < height; y++) {
      const row = values[y] || []
      for (let x = 0; x < width; x++) {
        const v = Math.max(0, Math.min(255, Math.round((row[x] || 0) * 255)))
        const o = (y * width + x) * 4
        data[o] = v
        data[o + 1] = v
        data[o + 2] = v
        data[o + 3] = 255
      }
    }
    const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
    tex.needsUpdate = true
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    return tex
  }, [field])

  if (mix <= 0) return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial map={texture} transparent opacity={0.25 * mix} depthWrite={false} />
    </mesh>
  )
}
