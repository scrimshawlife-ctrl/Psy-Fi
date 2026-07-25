import * as THREE from 'three/webgpu'
import {
  Fn,
  float,
  instancedArray,
  instanceIndex,
  uniform,
  vec3,
  sin,
  cos,
  clamp,
  If,
  color as tslColor,
} from 'three/tsl'
import { seedParticles, type Particle } from './ParticleSystem'

export interface FlowComputeUniforms {
  turbulence: number
  intensity: number
  peripheralFlow: number
  time: number
  dt: number
}

export interface GpuFlowComputePipeline {
  count: number
  backend: 'webgpu'
  positionBuffer: ReturnType<typeof instancedArray>
  velocityBuffer: ReturnType<typeof instancedArray>
  /** Dispatch each frame before render. */
  computeNode: { isComputeNode?: boolean }
  material: InstanceType<typeof THREE.SpriteNodeMaterial>
  object: THREE.Sprite
  setUniforms: (u: FlowComputeUniforms) => void
  reseed: (seed: number) => void
  dispose: () => void
}

function writeParticlesToBuffers(
  positions: { value: { array: ArrayLike<number> & { [i: number]: number }; needsUpdate: boolean } },
  velocities: { value: { array: ArrayLike<number> & { [i: number]: number }; needsUpdate: boolean } },
  particles: Particle[],
) {
  const pa = positions.value.array as Float32Array
  const va = velocities.value.array as Float32Array
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const o = i * 3
    pa[o] = p.x
    pa[o + 1] = p.y
    pa[o + 2] = p.z
    va[o] = p.vx
    va[o + 1] = p.vy
    va[o + 2] = p.vz
  }
  positions.value.needsUpdate = true
  velocities.value.needsUpdate = true
}

/**
 * Build a WebGPU TSL compute pipeline that mirrors CPU `sampleFlow` + integrate.
 * Positions stay on GPU and drive a SpriteNodeMaterial (no per-frame readback).
 */
export function createGpuFlowCompute(count: number, seed: number, color: string): GpuFlowComputePipeline {
  const positionBuffer = instancedArray(count, 'vec3')
  const velocityBuffer = instancedArray(count, 'vec3')

  const uTurbulence = uniform(0.25)
  const uIntensity = uniform(0.5)
  const uPeripheral = uniform(0.25)
  const uTime = uniform(0)
  const uDt = uniform(1 / 60)
  const uDamp = uniform(0.92)
  const uLimit = uniform(2.4)

  const computeNode = Fn(() => {
    const pos = positionBuffer.element(instanceIndex).toVar()
    const vel = velocityBuffer.element(instanceIndex).toVar()

    const amp = float(0.35).add(uIntensity.mul(0.9)).add(uTurbulence.mul(0.55))
    const swirl = float(0.2).add(uPeripheral.mul(0.8))
    const t = uTime

    const fx = sin(pos.y.mul(1.7).add(t.mul(0.9)))
      .mul(amp)
      .mul(0.55)
      .add(cos(pos.z.mul(1.3).sub(t.mul(0.4))).mul(swirl).mul(0.35))
    const fy = cos(pos.x.mul(1.4).sub(t.mul(0.7)))
      .mul(amp)
      .mul(0.35)
      .add(sin(pos.z.mul(1.1).add(t.mul(0.55))).mul(swirl).mul(0.25))
    const fz = sin(pos.x.mul(1.2).add(pos.y.mul(0.9)).add(t.mul(0.65)))
      .mul(amp)
      .mul(0.55)
      .sub(cos(pos.y.mul(1.5).sub(t.mul(0.5))).mul(swirl).mul(0.3))

    const flow = vec3(fx, fy, fz)
    vel.assign(flow)
    pos.assign(pos.add(flow.mul(uDt)))
    vel.assign(vel.mul(uDamp))

    // Soft wrap X/Z; clamp Y — matches ParticleSystem.ts
    If(pos.x.greaterThan(uLimit), () => {
      pos.x.assign(pos.x.sub(uLimit.mul(2)))
    })
    If(pos.x.lessThan(uLimit.negate()), () => {
      pos.x.assign(pos.x.add(uLimit.mul(2)))
    })
    If(pos.z.greaterThan(uLimit), () => {
      pos.z.assign(pos.z.sub(uLimit.mul(2)))
    })
    If(pos.z.lessThan(uLimit.negate()), () => {
      pos.z.assign(pos.z.add(uLimit.mul(2)))
    })
    pos.y.assign(clamp(pos.y, uLimit.negate(), uLimit))

    positionBuffer.element(instanceIndex).assign(pos)
    velocityBuffer.element(instanceIndex).assign(vel)
  })().compute(count)

  const material = new THREE.SpriteNodeMaterial()
  material.positionNode = positionBuffer.toAttribute()
  material.colorNode = tslColor(new THREE.Color(color))
  // size scales with intensity via uniform-driven scaleNode updated each frame
  const uScale = uniform(0.04)
  material.scaleNode = uScale
  material.transparent = true
  material.depthWrite = false

  const object = new THREE.Sprite(material)
  object.count = count
  object.frustumCulled = false

  writeParticlesToBuffers(
    positionBuffer as never,
    velocityBuffer as never,
    seedParticles(count, seed),
  )

  return {
    count,
    backend: 'webgpu',
    positionBuffer,
    velocityBuffer,
    computeNode: computeNode as { isComputeNode?: boolean },
    material,
    object,
    setUniforms(u: FlowComputeUniforms) {
      uTurbulence.value = u.turbulence
      uIntensity.value = u.intensity
      uPeripheral.value = u.peripheralFlow
      uTime.value = u.time
      uDt.value = u.dt
      uScale.value = 0.028 * (0.7 + u.intensity * 0.55)
    },
    reseed(nextSeed: number) {
      writeParticlesToBuffers(
        positionBuffer as never,
        velocityBuffer as never,
        seedParticles(count, nextSeed),
      )
    },
    dispose() {
      material.dispose()
      // storage buffers are GC'd with nodes; drop GPU refs
      object.removeFromParent()
    },
  }
}

/** Dispatch compute on a WebGPU renderer (sync when ready, else async). */
export function dispatchFlowCompute(
  gl: { compute?: (n: unknown) => void; computeAsync?: (n: unknown) => Promise<void> },
  pipeline: GpuFlowComputePipeline,
): void {
  if (typeof gl.compute === 'function') {
    gl.compute(pipeline.computeNode)
    return
  }
  if (typeof gl.computeAsync === 'function') {
    void gl.computeAsync(pipeline.computeNode)
  }
}
