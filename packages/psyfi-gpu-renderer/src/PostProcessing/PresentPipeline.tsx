import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import {
  pass,
  uniform,
  vec3,
  float,
  mix,
  max,
  div,
  mul,
  select,
  greaterThan,
  renderOutput,
  mrt,
  output,
  normalView,
  metalness,
  velocity,
} from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js'
import { ao } from 'three/addons/tsl/display/GTAONode.js'
import { ssr } from 'three/addons/tsl/display/SSRNode.js'
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js'
import { rgbShift } from 'three/addons/tsl/display/RGBShiftNode.js'
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'
import { tierConfig } from '../contracts/QualityTier'
import { resolveTemporalPolicy } from './TemporalAccumulate'
import { disposePresentResources, type DisposableGpuResource } from './presentDispose'

/**
 * Present path: scene → GTAO → SSR → bloom → DoF → motion blur → chroma → temporal → grade → safety.
 */
export function PresentPipeline({
  snapshot,
  tier,
}: {
  snapshot: SceneSnapshotV1 | null
  tier: QualityTier
}) {
  const { gl, scene, camera } = useThree()
  const cfg = tierConfig(tier)
  const postRef = useRef<InstanceType<typeof THREE.PostProcessing> | null>(null)
  const uSafety = useMemo(() => uniform(1), [])
  const uExposure = useMemo(() => uniform(1), [])
  const uGrade = useMemo(() => uniform(new THREE.Vector3(1, 1, 1)), [])
  const bloomStrengthRef = useRef<{ value: number } | null>(null)
  const temporalDampRef = useRef<{ value: number } | null>(null)
  const lastLuma = useRef(0.45)
  const flashTimes = useRef<number[]>([])
  const lastIntensity = useRef(0.5)

  useEffect(() => {
    const renderer = gl as unknown as InstanceType<typeof THREE.WebGPURenderer>
    const scenePass = pass(scene, camera)
    const disposables: DisposableGpuResource[] = [scenePass]
    const needsMrt = cfg.post.ssao || cfg.post.ssr || cfg.post.motionBlur

    if (needsMrt) {
      scenePass.setMRT(
        mrt({
          output,
          normal: normalView,
          metalness,
          ...(cfg.post.motionBlur ? { velocity } : {}),
        }),
      )
    }

    const color = scenePass.getTextureNode('output')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = color
    const depth = scenePass.getTextureNode('depth')
    const normal = needsMrt ? scenePass.getTextureNode('normal') : null

    if (cfg.post.ssao && normal) {
      const aoPass = ao(depth, normal, camera)
      aoPass.resolutionScale = tier === 'balanced' ? 0.5 : 1
      disposables.push(aoPass)
      node = aoPass.getTextureNode().mul(color)
    }

    if (cfg.post.ssr && normal) {
      const metal = scenePass.getTextureNode('metalness')
      const ssrPass = ssr(node, depth, normal, metal, camera)
      disposables.push(ssrPass)
      node = node.add(ssrPass.getTextureNode().mul(float(0.28)))
    }

    if (cfg.post.bloom) {
      const bloomPass = bloom(node, 0.35, 0.4, 0.85)
      bloomStrengthRef.current = bloomPass.strength
      disposables.push(bloomPass)
      node = node.add(bloomPass)
    } else {
      bloomStrengthRef.current = null
    }

    if (cfg.post.depthOfField) {
      const viewZ = scenePass.getViewZNode('depth')
      // Subtle DoF — Neutral path still reads clearly via safety/exposure later
      const dofPass = dof(node, viewZ, float(2.2), float(0.018), float(0.006))
      disposables.push(dofPass)
      node = dofPass
    }

    if (cfg.post.motionBlur) {
      const vel = scenePass.getTextureNode('velocity')
      const mb = motionBlur(node, vel, 8)
      disposables.push(mb)
      node = mb
    }

    if (cfg.post.chromaticAberration) {
      const chroma = rgbShift(node, 0.0018, 0.0)
      disposables.push(chroma)
      node = chroma
    }

    if (cfg.post.taa) {
      const temporal = afterImage(node, 0.82)
      temporalDampRef.current = temporal.damp
      disposables.push(temporal)
      node = temporal.getTextureNode()
    } else {
      temporalDampRef.current = null
    }

    if (cfg.post.colorGrading || cfg.post.hdr) {
      node = node.mul(uGrade).mul(uExposure)
    }

    // Mandatory safety: peak luminance clamp (safety_clamp.wgsl) then attenuator.
    // Peak clamp must run even when uSafety === 1 (common happy path).
    const peak = max(node.r, max(node.g, node.b))
    const peakScale = select(greaterThan(peak, float(0.96)), div(float(0.96), peak), float(1))
    node = mul(node, peakScale)
    node = node.mul(uSafety)
    node = mix(vec3(0.05, 0.05, 0.055), node, float(0.98))

    if (cfg.post.hdr) {
      node = renderOutput(node)
    }

    const post = new THREE.PostProcessing(renderer, node)
    post.outputColorTransform = !cfg.post.hdr
    postRef.current = post
    disposables.push(post)

    renderer.toneMapping = cfg.post.hdr ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping
    renderer.toneMappingExposure = 1.0

    return () => {
      postRef.current = null
      bloomStrengthRef.current = null
      temporalDampRef.current = null
      disposePresentResources(disposables)
    }
  }, [
    gl,
    scene,
    camera,
    cfg.post.bloom,
    cfg.post.taa,
    cfg.post.ssao,
    cfg.post.ssr,
    cfg.post.depthOfField,
    cfg.post.motionBlur,
    cfg.post.chromaticAberration,
    cfg.post.colorGrading,
    cfg.post.hdr,
    uExposure,
    uGrade,
    uSafety,
    tier,
  ])

  useFrame((state) => {
    const now = state.clock.elapsedTime * 1000
    const intensity = snapshot?.parameter_field.intensity ?? 0.5
    const energy = Number(snapshot?.parameter_field.palette?.energy ?? 0.5)
    const neutral = !!snapshot?.parameter_field.neutral_view
    const maxDelta = snapshot?.safety?.max_luminance_delta ?? 0.35
    const maxFlash = snapshot?.safety?.max_flash_hz ?? 2

    const baseExp = snapshot?.camera?.exposure ?? 1
    let exposure = baseExp * (0.75 + intensity * 0.45)
    if (cfg.post.hdr) exposure *= 0.9 + energy * 0.25
    if (neutral) exposure *= 0.55
    uExposure.value = exposure

    const gradeBoost = cfg.post.colorGrading ? 0.08 * energy : 0
    uGrade.value.set(1 + gradeBoost, 1 + gradeBoost * 0.9, 1 + gradeBoost * 1.05)

    if (bloomStrengthRef.current) {
      bloomStrengthRef.current.value = neutral || !cfg.post.bloom ? 0 : 0.2 + intensity * 0.35
    }

    const approxLuma = neutral ? 0.12 : 0.35 + intensity * 0.4 * energy
    const delta = Math.abs(approxLuma - lastLuma.current)
    if (delta > maxDelta * 0.85) flashTimes.current.push(now)
    flashTimes.current = flashTimes.current.filter((t) => now - t < 1000)
    let atten = 1
    if (flashTimes.current.length > maxFlash) atten *= 0.55
    if (delta > maxDelta) atten *= 0.7
    if (neutral) atten *= 0.65
    uSafety.value = atten
    lastLuma.current = approxLuma * atten + lastLuma.current * (1 - atten)

    const intensityDelta = Math.abs(intensity - lastIntensity.current)
    lastIntensity.current = intensity
    const motionProxy = Math.min(
      1,
      intensityDelta * 4 + (neutral ? 0 : energy * 0.15) + delta * 1.2,
    )
    if (temporalDampRef.current) {
      const policy = resolveTemporalPolicy({
        enabled: cfg.post.taa,
        neutral,
        motionProxy,
        safetyAtten: atten,
        baseDamp: 0.82,
      })
      temporalDampRef.current.value = policy.damp
    }

    if (postRef.current) {
      postRef.current.needsUpdate = true
      postRef.current.render()
    }
    // else: skip present — never raw-render without the safety graph
    // (mount / tier rebuild). Prior framebuffer is retained.
  }, 1)

  return null
}
