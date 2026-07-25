import { Canvas } from '@react-three/fiber'
import { Suspense, type ReactNode } from 'react'
import { createWebGPURenderer } from './createWebGPURenderer'
import { SceneRoot } from '../SceneGraph/SceneRoot'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'
import type { QualityTier } from '../contracts/QualityTier'

export interface PsyFiGPUCanvasProps {
  snapshot: SceneSnapshotV1 | null
  tier: QualityTier
  children?: ReactNode
}

export function PsyFiGPUCanvas({ snapshot, tier, children }: PsyFiGPUCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={async (props) => createWebGPURenderer(props as never)}
      camera={{ position: [0, 0.35, 2.4], fov: 45, near: 0.05, far: 80 }}
      style={{ width: '100%', height: '100%', background: '#07070B' }}
    >
      <Suspense fallback={null}>
        <SceneRoot snapshot={snapshot} tier={tier} />
        {children}
      </Suspense>
    </Canvas>
  )
}
