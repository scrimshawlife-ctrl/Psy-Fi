import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'
import { tierConfig } from '../contracts/QualityTier'
import { PresentPipeline } from './PresentPipeline'
import { SafetyPassNote } from './SafetyPassNote'

/**
 * G1/G2 post stack: PresentPipeline owns bloom, temporal accumulate, grade, mandatory safety.
 */
export function PostStack({
  snapshot,
  tier,
}: {
  snapshot: SceneSnapshotV1
  tier: QualityTier
}) {
  const cfg = tierConfig(tier)
  const enabled = Object.entries(cfg.post)
    .filter(([, v]) => v)
    .map(([k]) => k)

  return (
    <>
      <PresentPipeline snapshot={snapshot} tier={tier} />
      <SafetyPassNote
        maxLuminanceDelta={snapshot.safety?.max_luminance_delta ?? 0.35}
        maxFlashHz={snapshot.safety?.max_flash_hz ?? 2}
        enabledPasses={enabled}
        neutral={!!snapshot.parameter_field.neutral_view}
      />
    </>
  )
}
