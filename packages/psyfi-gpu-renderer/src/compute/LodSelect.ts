export type LodLevel = 0 | 1 | 2

/**
 * Pick LOD from camera distance and tier draw budget.
 * 0 = full, 1 = medium, 2 = impostor / skip detail.
 */
export function selectLod(
  distance: number,
  opts: { near: number; mid: number; far: number; drawBudget: number; drawIndex: number },
): LodLevel {
  if (opts.drawIndex >= opts.drawBudget) return 2
  if (distance < opts.near) return 0
  if (distance < opts.mid) return 1
  if (distance < opts.far) return 2
  return 2
}

export function lodScale(level: LodLevel): number {
  if (level === 0) return 1
  if (level === 1) return 0.65
  return 0.35
}
