export interface CullSphere {
  x: number
  y: number
  z: number
  radius: number
}

export interface FrustumPlanes {
  /** Camera-facing half-space: ax+by+cz+d >= 0 is inside for each plane. */
  planes: Array<[number, number, number, number]>
}

/** Distance + frustum cull. Returns visible indices. */
export function cullInstances(
  items: CullSphere[],
  camera: { x: number; y: number; z: number },
  maxDistance: number,
  frustum?: FrustumPlanes,
): number[] {
  const visible: number[] = []
  const maxD2 = maxDistance * maxDistance
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const dx = it.x - camera.x
    const dy = it.y - camera.y
    const dz = it.z - camera.z
    const d2 = dx * dx + dy * dy + dz * dz
    if (d2 > maxD2) continue
    if (frustum) {
      let inside = true
      for (const [a, b, c, d] of frustum.planes) {
        if (a * it.x + b * it.y + c * it.z + d < -it.radius) {
          inside = false
          break
        }
      }
      if (!inside) continue
    }
    visible.push(i)
  }
  return visible
}
