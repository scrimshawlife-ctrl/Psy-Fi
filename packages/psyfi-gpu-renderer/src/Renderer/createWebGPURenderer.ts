import * as THREE from 'three/webgpu'

/**
 * Async factory for R3F Canvas `gl` prop — WebGPU first.
 * `powerPreference: 'high-performance'` steers Chrome/Edge toward the NVIDIA dGPU
 * (e.g. RTX 5060) when a hybrid iGPU+dGPU system is present.
 */
export async function createWebGPURenderer(
  props: ConstructorParameters<typeof THREE.WebGPURenderer>[0] & {
    canvas?: HTMLCanvasElement | OffscreenCanvas
  },
) {
  const renderer = new THREE.WebGPURenderer({
    ...(props as object),
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  } as ConstructorParameters<typeof THREE.WebGPURenderer>[0])
  await renderer.init()
  return renderer
}
