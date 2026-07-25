import type { QualityTier } from '../contracts/QualityTier'

export interface UltraQaTarget {
  id: string
  vendor: string
  description: string
  expectBand: 'ultra' | 'high'
  expectTier: QualityTier
}

export const ULTRA_QA_TARGETS: UltraQaTarget[] = [
  {
    id: 'nvidia-rtx-5060',
    vendor: 'nvidia',
    description: 'NVIDIA GeForce RTX 5060',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'nvidia-rtx-3080',
    vendor: 'nvidia',
    description: 'NVIDIA GeForce RTX 3080',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'nvidia-rtx-4070',
    vendor: 'nvidia',
    description: 'NVIDIA GeForce RTX 4070 SUPER',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'amd-rx-7800xt',
    vendor: 'amd',
    description: 'AMD Radeon RX 7800 XT',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'amd-rx-9070xt',
    vendor: 'amd',
    description: 'AMD Radeon RX 9070 XT',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'intel-arc-a770',
    vendor: 'intel',
    description: 'Intel(R) Arc(TM) A770 Graphics',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'apple-m3-max',
    vendor: 'apple',
    description: 'Apple M3 Max',
    expectBand: 'ultra',
    expectTier: 'ultra',
  },
  {
    id: 'nvidia-rtx-2080',
    vendor: 'nvidia',
    description: 'NVIDIA GeForce RTX 2080 Ti',
    expectBand: 'high',
    expectTier: 'high',
  },
]
