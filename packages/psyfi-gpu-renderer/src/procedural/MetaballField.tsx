import type { ProceduralNode } from '../contracts/SceneSnapshot'

export function MetaballField({ nodes, color }: { nodes: ProceduralNode[]; color: string }) {
  return (
    <group>
      {nodes.map((n) => {
        const center = (n.center as number[]) || [0, 0, 0]
        const radius = Number(n.radius) || 0.2
        return (
          <mesh key={n.id} position={[center[0], center[1], center[2]]}>
            <sphereGeometry args={[radius, 24, 24]} />
            <meshStandardMaterial color={color} transparent opacity={0.55} roughness={0.35} metalness={0.1} />
          </mesh>
        )
      })}
    </group>
  )
}
