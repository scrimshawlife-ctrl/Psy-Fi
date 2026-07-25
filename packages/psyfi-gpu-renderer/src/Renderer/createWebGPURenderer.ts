import * as THREE from 'three/webgpu'

/** Async factory for R3F Canvas `gl` prop — WebGPU first, WebGL backend fallback inside Three. */
export async function createWebGPURenderer(props: ConstructorParameters<typeof THREE.WebGPURenderer>[0]) {
  const renderer = new THREE.WebGPURenderer({
    ...(props as object),
    antialias: true,
    alpha: false,
  } as ConstructorParameters<typeof THREE.WebGPURenderer>[0])
  await renderer.init()
  return renderer
}
