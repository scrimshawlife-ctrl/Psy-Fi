import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'
import { tierConfig } from '../contracts/QualityTier'
import { SafetyPassNote } from './SafetyPassNote'

/**
 * Post stack shell. G0 wires tier flags + mandatory safety contract.
 * G1+ replaces placeholders with TSL/WGSL passes (TAA, SSAO, SSR, bloom, …).
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
    <SafetyPassNote
      maxLuminanceDelta={snapshot.safety?.max_luminance_delta ?? 0.35}
      maxFlashHz={snapshot.safety?.max_flash_hz ?? 2}
      enabledPasses={enabled}
      neutral={!!snapshot.parameter_field.neutral_view}
    />
  )
}
