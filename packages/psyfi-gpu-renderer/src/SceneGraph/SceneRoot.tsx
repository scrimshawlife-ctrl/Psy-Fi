import { ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'
import { tierConfig } from '../contracts/QualityTier'
import { CrystalField } from '../procedural/CrystalField'
import { MetaballField } from '../procedural/MetaballField'
import { RibbonField } from '../procedural/RibbonField'
import { GlyphField } from '../procedural/GlyphField'
import { MagnitudePlane } from '../procedural/MagnitudePlane'
import { FlowParticleField } from '../procedural/FlowParticleField'
import { LightingRig } from '../Lighting/LightingRig'
import { PostStack } from '../PostProcessing/PostStack'
import { SceneAssetLayer } from '../AssetPipeline/SceneAssetLayer'
import { PF_CYAN, PF_PAPER } from '../styles/tokens'

export function SceneRoot({
  snapshot,
  tier,
}: {
  snapshot: SceneSnapshotV1 | null
  tier: QualityTier
}) {
  const root = useRef<Group>(null)
  const cfg = tierConfig(tier)
  const engines = snapshot?.parameter_field.engines || {}
  const intensity = snapshot?.parameter_field.intensity ?? 0.5
  const neutral = !!snapshot?.parameter_field.neutral_view

  const palette = useMemo(() => {
    const tracers = (snapshot?.parameter_field.palette?.tracers as string) || PF_CYAN
    return tracers
  }, [snapshot?.parameter_field.palette])

  useFrame((_, dt) => {
    if (!root.current || neutral) return
    root.current.rotation.y += dt * (0.15 + intensity * 0.35)
  })

  if (!snapshot) return null

  return (
    <>
      <LightingRig snapshot={snapshot} tier={tier} />
      <group ref={root}>
        {!neutral && <CrystalField nodes={snapshot.procedural.crystals} color={palette} engines={engines} />}
        {!neutral && <MetaballField nodes={snapshot.procedural.metaballs} color={palette} />}
        {!neutral && <RibbonField nodes={snapshot.procedural.ribbons} color={palette} />}
        {!neutral && <GlyphField nodes={snapshot.procedural.glyphs} color={palette} />}
        {!neutral && tier !== 'battery' ? (
          <FlowParticleField snapshot={snapshot} tier={tier} />
        ) : null}
        {snapshot.magnitude_field ? (
          <MagnitudePlane field={snapshot.magnitude_field} mix={neutral ? 0 : 0.35} />
        ) : null}
        <SceneAssetLayer snapshot={snapshot} enabled={!neutral && tier !== 'battery'} />
      </group>
      {!neutral && cfg.post.contactShadows ? (
        <ContactShadows
          position={[0, -0.85, 0]}
          opacity={0.45}
          scale={8}
          blur={tier === 'ultra' ? 2.2 : 2.8}
          far={4}
          resolution={tier === 'ultra' ? 1024 : 512}
          color={PF_PAPER}
        />
      ) : null}
      <PostStack snapshot={snapshot} tier={tier} />
    </>
  )
}
