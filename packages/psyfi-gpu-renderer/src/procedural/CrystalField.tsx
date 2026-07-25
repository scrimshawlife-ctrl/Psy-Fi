import { Instances, Instance } from '@react-three/drei'
import type { ProceduralNode } from '../contracts/SceneSnapshot'

export function CrystalField({
  nodes,
  color,
  engines,
}: {
  nodes: ProceduralNode[]
  color: string
  engines: Record<string, number>
}) {
  const lattice = engines.entity_lattice ?? 0.1
  const items = nodes.flatMap((n, ni) => {
    const budget = Math.min(48, Number(n.instance_budget) || 32)
    const seed = Number(n.seed) || ni
    return Array.from({ length: Math.max(4, Math.floor(budget * (0.25 + lattice))) }, (_, i) => {
      const a = seed * 0.01 + i * 1.618
      const r = 0.35 + (i % 7) * 0.08
      return {
        key: `${n.id}_${i}`,
        position: [Math.cos(a) * r, ((i % 5) - 2) * 0.12, Math.sin(a) * r] as [number, number, number],
        scale: 0.04 + (i % 3) * 0.015,
      }
    })
  })

  return (
    <Instances limit={512} range={items.length}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.25} />
      {items.map((it) => (
        <Instance key={it.key} position={it.position} scale={it.scale} />
      ))}
    </Instances>
  )
}
