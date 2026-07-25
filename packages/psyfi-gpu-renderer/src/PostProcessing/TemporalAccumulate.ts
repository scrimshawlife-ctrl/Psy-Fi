/**
 * Portable temporal accumulation policy for G2 TAA wiring.
 * Higher history damp = smoother / more ghosting; motion and Neutral cut history.
 */

export interface TemporalPolicyInput {
  enabled: boolean
  neutral: boolean
  /** 0..1 proxy for camera/field motion (intensity energy, rotation, etc.). */
  motionProxy: number
  /** Safety attenuator 0..1 from PresentPipeline. */
  safetyAtten: number
  /** Tier base history retention when calm (afterImage damp). */
  baseDamp?: number
}

export interface TemporalPolicy {
  /** afterImage damp in [0, 1]; 0 disables temporal history. */
  damp: number
  /** Blend toward current frame (1 - effective history). */
  currentWeight: number
}

export function resolveTemporalPolicy(input: TemporalPolicyInput): TemporalPolicy {
  if (!input.enabled || input.neutral) {
    return { damp: 0, currentWeight: 1 }
  }
  const base = input.baseDamp ?? 0.82
  const motion = Math.min(1, Math.max(0, input.motionProxy))
  const atten = Math.min(1, Math.max(0, input.safetyAtten))
  // Cut history when moving or when safety is clamping flashes
  let damp = base * (1 - motion * 0.65) * (0.35 + atten * 0.65)
  damp = Math.min(0.92, Math.max(0, damp))
  if (damp < 0.05) damp = 0
  return { damp, currentWeight: 1 - damp }
}

/** Neighborhood-clamp helper (CPU reference for WGSL TAA resolve). */
export function clampHistorySample(
  history: [number, number, number],
  neighborhoodMin: [number, number, number],
  neighborhoodMax: [number, number, number],
): [number, number, number] {
  return [
    Math.min(neighborhoodMax[0], Math.max(neighborhoodMin[0], history[0])),
    Math.min(neighborhoodMax[1], Math.max(neighborhoodMin[1], history[1])),
    Math.min(neighborhoodMax[2], Math.max(neighborhoodMin[2], history[2])),
  ]
}

export function accumulateColor(
  current: [number, number, number],
  history: [number, number, number],
  currentWeight: number,
): [number, number, number] {
  const w = Math.min(1, Math.max(0, currentWeight))
  const hw = 1 - w
  return [
    current[0] * w + history[0] * hw,
    current[1] * w + history[1] * hw,
    current[2] * w + history[2] * hw,
  ]
}
