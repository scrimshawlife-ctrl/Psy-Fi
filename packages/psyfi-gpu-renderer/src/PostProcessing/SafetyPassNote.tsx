/** Marker component documenting mandatory safety clamp in the graph. */
export function SafetyPassNote(_props: {
  maxLuminanceDelta: number
  maxFlashHz: number
  enabledPasses: string[]
  neutral: boolean
}) {
  // Actual clamp executes in post.safety WGSL/TSL (G1). Component keeps the
  // contract visible in the React tree so the pass cannot be omitted silently.
  return null
}
