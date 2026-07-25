import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useRef, type ReactNode } from 'react'
import { createWebGPURenderer } from './createWebGPURenderer'
import { SceneRoot } from '../SceneGraph/SceneRoot'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'
import {
  resolveOffscreenPresentMode,
  tryTransferToOffscreen,
  type OffscreenPresentMode,
} from './offscreenPresent'

export interface PsyFiGPUCanvasProps {
  snapshot: SceneSnapshotV1 | null
  tier: QualityTier
  /** Opt-in OffscreenCanvas present target (`?offscreen=1`). */
  preferOffscreen?: boolean
  onPresentMode?: (mode: OffscreenPresentMode) => void
  children?: ReactNode
}

export function PsyFiGPUCanvas({
  snapshot,
  tier,
  preferOffscreen = false,
  onPresentMode,
  children,
}: PsyFiGPUCanvasProps) {
  const cfgScale = tier === 'battery' ? 0.65 : tier === 'balanced' ? 0.85 : 1
  const transferred = useRef(false)
  const presentMode = useMemo(() => {
    const mode = resolveOffscreenPresentMode({ requested: preferOffscreen })
    onPresentMode?.(mode)
    return mode
  }, [preferOffscreen, onPresentMode])

  return (
    <Canvas
      shadows={tier !== 'battery'}
      dpr={[1, Math.min(2, 1.5 * cfgScale)]}
      gl={async (props) => {
        // Same-thread OffscreenCanvas: transfer the R3F canvas once when requested.
        const canvas = (props as { canvas?: HTMLCanvasElement }).canvas
        if (
          presentMode === 'offscreen-requested' &&
          canvas &&
          !transferred.current
        ) {
          const off = tryTransferToOffscreen(canvas)
          if (off) {
            transferred.current = true
            return createWebGPURenderer({ ...(props as object), canvas: off } as never)
          }
          onPresentMode?.('offscreen-unsupported')
        }
        return createWebGPURenderer(props as never)
      }}
      camera={{ position: [0, 0.35, 2.4], fov: 45, near: 0.05, far: 80 }}
      style={{ width: '100%', height: '100%', background: 'var(--pf-bg-0)' }}
    >
      <Suspense fallback={null}>
        <SceneRoot snapshot={snapshot} tier={tier} />
        {children}
      </Suspense>
    </Canvas>
  )
}
