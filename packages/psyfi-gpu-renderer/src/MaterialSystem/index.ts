/** PBR + procedural material graphs. Replaceable without touching analysis. */
export type MaterialId = 'pbr.standard' | 'crystal.procedural' | 'ribbon.standard' | 'glyph.wire'

export interface MaterialDescriptor {
  id: MaterialId
  metalness: number
  roughness: number
  emissive?: number
}

export function materialForKind(kind: string): MaterialDescriptor {
  if (kind.includes('crystal')) return { id: 'crystal.procedural', metalness: 0.55, roughness: 0.25 }
  if (kind.includes('ribbon')) return { id: 'ribbon.standard', metalness: 0.2, roughness: 0.4 }
  if (kind.includes('glyph')) return { id: 'glyph.wire', metalness: 0.6, roughness: 0.3 }
  return { id: 'pbr.standard', metalness: 0.3, roughness: 0.45 }
}
