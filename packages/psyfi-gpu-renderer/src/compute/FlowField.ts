/**
 * Portable flow-field sampler (CPU reference for WGSL `flow_advect`).
 * Driven only by ParameterField scalars — no symbolic inference.
 */

export interface FlowParams {
  turbulence: number
  intensity: number
  peripheralFlow: number
  time: number
}

/** Curl-ish 3D flow used by particle advection. */
export function sampleFlow(x: number, y: number, z: number, p: FlowParams): [number, number, number] {
  const t = p.time
  const amp = 0.35 + p.intensity * 0.9 + p.turbulence * 0.55
  const swirl = 0.2 + p.peripheralFlow * 0.8
  const fx =
    Math.sin(y * 1.7 + t * 0.9) * amp * 0.55 +
    Math.cos(z * 1.3 - t * 0.4) * swirl * 0.35
  const fy =
    Math.cos(x * 1.4 - t * 0.7) * amp * 0.35 +
    Math.sin(z * 1.1 + t * 0.55) * swirl * 0.25
  const fz =
    Math.sin(x * 1.2 + y * 0.9 + t * 0.65) * amp * 0.55 -
    Math.cos(y * 1.5 - t * 0.5) * swirl * 0.3
  return [fx, fy, fz]
}

export function advectPoint(
  pos: [number, number, number],
  dt: number,
  p: FlowParams,
): [number, number, number] {
  const [fx, fy, fz] = sampleFlow(pos[0], pos[1], pos[2], p)
  return [pos[0] + fx * dt, pos[1] + fy * dt, pos[2] + fz * dt]
}
