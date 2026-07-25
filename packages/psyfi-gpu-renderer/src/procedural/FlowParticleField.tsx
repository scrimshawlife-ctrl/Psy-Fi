import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { QualityTier } from '../contracts/QualityTier'
import { tierConfig } from '../contracts/QualityTier'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import {
  integrateParticles,
  particleBudgetForTier,
  seedParticles,
  type Particle,
} from '../compute/ParticleSystem'
import { cullInstances } from '../compute/InstanceCull'
import { lodScale, selectLod } from '../compute/LodSelect'

/**
 * G2 density layer: CPU-integrated flow particles (portable reference for WGSL compute).
 * Mutates InstancedMesh matrices each frame — no React re-render per tick.
 */
export function FlowParticleField({
  snapshot,
  tier,
}: {
  snapshot: SceneSnapshotV1
  tier: QualityTier
}) {
  const cfg = tierConfig(tier)
  const intensity = snapshot.parameter_field.intensity ?? 0.5
  const turbulence = Number(snapshot.parameter_field.parameters?.turbulence ?? 0.25)
  const peripheral = Number(snapshot.parameter_field.parameters?.peripheral_flow ?? 0.25)
  const seed = Number(snapshot.procedural.crystals[0]?.seed ?? 7)
  const count = particleBudgetForTier(Math.min(cfg.particleBudget, 2048), intensity)
  const color = (snapshot.parameter_field.palette?.tracers as string) || '#63F3E8'

  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<Particle[]>([])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    particles.current = seedParticles(count, seed)
    if (meshRef.current) {
      meshRef.current.count = count
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [count, seed])

  useFrame((state, dt) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    integrateParticles(particles.current, Math.min(dt, 0.05), {
      turbulence,
      intensity,
      peripheralFlow: peripheral,
      time: t,
    })
    const cam = state.camera.position
    const spheres = particles.current.map((p) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      radius: 0.04,
    }))
    const kept = cullInstances(spheres, { x: cam.x, y: cam.y, z: cam.z }, 6.5)
    const drawBudget = Math.min(cfg.maxDrawCalls * 8, kept.length, count)
    let written = 0
    for (let drawIndex = 0; drawIndex < drawBudget; drawIndex++) {
      const idx = kept[drawIndex]
      const p = particles.current[idx]
      const dist = Math.hypot(p.x - cam.x, p.y - cam.y, p.z - cam.z)
      const lod = selectLod(dist, {
        near: 1.2,
        mid: 2.8,
        far: 5.5,
        drawBudget,
        drawIndex,
      })
      const s = 0.035 * lodScale(lod) * (0.7 + intensity * 0.5)
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(written++, dummy.matrix)
    }
    mesh.count = written
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
    </instancedMesh>
  )
}
