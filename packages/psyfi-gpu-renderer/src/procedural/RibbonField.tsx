import { useMemo } from 'react'
import * as THREE from 'three'
import type { ProceduralNode } from '../contracts/SceneSnapshot'

export function RibbonField({ nodes, color }: { nodes: ProceduralNode[]; color: string }) {
  return (
    <group>
      {nodes.map((n, idx) => (
        <Ribbon key={n.id} node={n} color={color} index={idx} />
      ))}
    </group>
  )
}

function Ribbon({ node, color, index }: { node: ProceduralNode; color: string; index: number }) {
  const curve = useMemo(() => {
    const seed = Number(node.seed) || index
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 16; i++) {
      const t = i / 15
      const a = t * Math.PI * 2 + seed * 0.01
      pts.push(new THREE.Vector3(Math.cos(a) * (0.6 + t * 0.3), Math.sin(t * 4 + seed) * 0.25, Math.sin(a) * (0.6 + t * 0.3)))
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [node.seed, index])

  const geo = useMemo(() => {
    const thickness = Number(node.thickness) || 0.04
    return new THREE.TubeGeometry(curve, 64, thickness, 6, false)
  }, [curve, node.thickness])

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
    </mesh>
  )
}
