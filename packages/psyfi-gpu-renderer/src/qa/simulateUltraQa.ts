/**
 * Simulated P0 Ultra desktop QA — exercises adapter → tier → pass graph
 * without a physical GPU. Used as CI stand-in for human Ultra validation.
 */

import { classifyAdapterInfo, type GpuAdapterInfo } from '../contracts/GpuAdapter'
import {
  recommendedTier,
  resolveTier,
  tierConfig,
  type DeviceCaps,
  type QualityTier,
} from '../contracts/QualityTier'
import { enabledPasses as graphPasses } from '../contracts/RenderGraph'
import { G4_VISUAL_SEEDS } from '../contracts/g4Parity'
import { softPresentSnapshot, PIXEL_GOLDEN_SIZE } from '../goldens/softPresent'
import { metricsFromFrame } from '../goldens/pixelMetrics'
import type { SceneSnapshotV1 } from '../contracts/SceneSnapshot'

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

export interface UltraQaCheckResult {
  id: string
  ok: boolean
  detail: string
  adapter?: GpuAdapterInfo
  tier?: QualityTier
  passes?: string[]
}

function capsFromAdapter(adapter: GpuAdapterInfo, overrides: Partial<DeviceCaps> = {}): DeviceCaps {
  return {
    webgpu: true,
    maxTextureSize: adapter.isHighEndDiscrete ? 16384 : 8192,
    preferBattery: false,
    isMobile: false,
    preferUltra: adapter.isHighEndDiscrete,
    isNvidia: adapter.isNvidia,
    isDiscrete: adapter.isDiscrete,
    adapter,
    ...overrides,
  }
}

export function runAdapterUltraChecks(targets: UltraQaTarget[] = ULTRA_QA_TARGETS): UltraQaCheckResult[] {
  return targets.map((t) => {
    const adapter = classifyAdapterInfo({ vendor: t.vendor, description: t.description })
    const caps = capsFromAdapter(adapter)
    const tier = recommendedTier(caps)
    const passes = graphPasses(tier, caps)
    const bandOk = adapter.perfBand === t.expectBand
    const tierOk = tier === t.expectTier
    const ultraPassesOk =
      t.expectTier !== 'ultra' ||
      (passes.includes('post.ssao') && passes.includes('post.ssr') && passes.includes('post.safety'))
    const ok = bandOk && tierOk && ultraPassesOk && adapter.isDiscrete
    return {
      id: t.id,
      ok,
      detail: ok
        ? `band=${adapter.perfBand} tier=${tier} passes=${passes.length} targetMs=${tierConfig(tier).targetFrameMs}`
        : `expected band=${t.expectBand} tier=${t.expectTier}; got band=${adapter.perfBand} tier=${tier}`,
      adapter,
      tier,
      passes,
    }
  })
}

export function runBatteryClampCheck(): UltraQaCheckResult {
  const adapter = classifyAdapterInfo({
    vendor: 'nvidia',
    description: 'NVIDIA GeForce RTX 5060',
  })
  const caps = capsFromAdapter(adapter, { preferBattery: true, preferUltra: false })
  const resolved = resolveTier('ultra', caps)
  const ok = resolved === 'balanced'
  return {
    id: 'battery-clamp-ultra',
    ok,
    detail: ok ? `ultra→${resolved} under preferBattery` : `expected balanced, got ${resolved}`,
    adapter,
    tier: resolved,
  }
}

export function runSoftPresentDistinctness(
  snapshots: SceneSnapshotV1[],
): UltraQaCheckResult {
  const hashes = snapshots.map((s) => metricsFromFrame(softPresentSnapshot(s, PIXEL_GOLDEN_SIZE)).sha256)
  const ok = new Set(hashes).size === hashes.length && hashes.length === G4_VISUAL_SEEDS.length
  return {
    id: 'pixel-distinctness',
    ok,
    detail: ok
      ? `soft-present distinct for ${hashes.length} G4 seeds`
      : `expected ${G4_VISUAL_SEEDS.length} distinct hashes, got ${new Set(hashes).size}`,
  }
}

export interface UltraQaReport {
  schema: 'psyfi.simulated_ultra_qa.v1'
  date: string
  mode: 'simulated'
  checks: UltraQaCheckResult[]
  summary: { total: number; passed: number; failed: number }
}

export function buildUltraQaReport(checks: UltraQaCheckResult[]): UltraQaReport {
  const passed = checks.filter((c) => c.ok).length
  return {
    schema: 'psyfi.simulated_ultra_qa.v1',
    date: new Date().toISOString().slice(0, 10),
    mode: 'simulated',
    checks,
    summary: { total: checks.length, passed, failed: checks.length - passed },
  }
}
