/** Minimal dispose surface shared by PassNode / Bloom / GTAO / SSR / AfterImage / PostProcessing. */
export type DisposableGpuResource = {
  dispose?: () => void
}

/**
 * Dispose post-FX nodes and the PostProcessing wrapper.
 * Order: effect nodes first (own RTs), then pass, then PostProcessing quad.
 */
export function disposePresentResources(resources: DisposableGpuResource[]): void {
  for (let i = resources.length - 1; i >= 0; i--) {
    const resource = resources[i]
    try {
      resource.dispose?.()
    } catch {
      // Renderer/context may already be lost during unmount.
    }
  }
}
