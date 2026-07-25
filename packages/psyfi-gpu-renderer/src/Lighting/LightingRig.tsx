import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'
import { tierConfig } from '../contracts/QualityTier'

export function LightingRig({
  snapshot,
  tier,
}: {
  snapshot: SceneSnapshotV1
  tier: QualityTier
}) {
  const cfg = tierConfig(tier)
  const ambient = Number(snapshot.lighting.ambient_intensity) || 0.25
  const key = Number(snapshot.lighting.key_intensity) || 1.2
  const neutral = !!snapshot.parameter_field.neutral_view
  const fogNear = cfg.post.volumetricFog && !neutral ? 1.6 : 8
  const fogFar = cfg.post.volumetricFog && !neutral ? 9.5 : 40
  return (
    <>
      <color attach="background" args={['#0a0e14']} />
      <fog attach="fog" args={['#0a0e14', fogNear, fogFar]} />
      <ambientLight intensity={ambient} />
      <directionalLight
        castShadow={cfg.post.contactShadows}
        position={[2.5, 4, 2]}
        intensity={key}
        shadow-mapSize-width={cfg.tier === 'ultra' ? 2048 : 1024}
        shadow-mapSize-height={cfg.tier === 'ultra' ? 2048 : 1024}
      />
      {/* Field-only violet fill; chrome stays cyan-signal per design.md */}
      <pointLight position={[-2, 1.5, -1]} intensity={0.4} color="#7a8fd4" />
    </>
  )
}
