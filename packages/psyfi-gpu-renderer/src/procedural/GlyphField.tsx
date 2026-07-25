import type { ProceduralNode } from '../contracts/SceneSnapshot'

/** Vector glyph stand-in: procedural torus knots until SDF glyph atlas lands. */
export function GlyphField({ nodes, color }: { nodes: ProceduralNode[]; color: string }) {
  return (
    <group>
      {nodes.map((n) => {
        const orbit = (n.orbit as number[]) || [0, 0, 0]
        const scale = Number(n.scale) || 0.2
        return (
          <mesh key={n.id} position={[orbit[0], orbit[1], orbit[2]]} scale={scale}>
            <torusKnotGeometry args={[1, 0.28, 64, 12]} />
            <meshStandardMaterial color={color} wireframe roughness={0.3} metalness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
