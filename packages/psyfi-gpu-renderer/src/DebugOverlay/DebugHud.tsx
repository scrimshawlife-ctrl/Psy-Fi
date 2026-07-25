import type { SnapshotStoreStats } from '../bridge/SnapshotStore'
import type { QualityTier } from '../contracts/QualityTier'
import type { FrameProfilerSummary } from '../Profiling/FrameProfiler'

function fmtMs(n: number): string {
  return n.toFixed(1)
}

function fmtFps(n: number): string {
  return n > 0 ? n.toFixed(0) : '—'
}

export function DebugHud({
  tier,
  stats,
  passIds,
  webgpu,
  adapterLabel,
  vendorLabel,
  perfBand,
  profile,
  particleBudget,
}: {
  tier: QualityTier
  stats: SnapshotStoreStats
  passIds: string[]
  webgpu: boolean
  adapterLabel?: string
  /** nvidia | amd | intel | apple | unknown */
  vendorLabel?: string
  perfBand?: string
  profile?: FrameProfilerSummary | null
  particleBudget?: number
}) {
  const vendorTag =
    vendorLabel && vendorLabel !== 'unknown' ? ` · ${vendorLabel.toUpperCase()}` : ''
  const bandTag = perfBand && perfBand !== 'unknown' ? ` · band ${perfBand}` : ''
  const budgetClass = profile?.overBudget ? 'gpu-hud-over' : 'gpu-hud-ok'
  return (
    <div className="gpu-hud">
      <div>
        <strong>GPU platform</strong> · tier {tier} · {webgpu ? 'WebGPU ok' : 'no navigator.gpu'}
        {vendorTag}
        {bandTag}
      </div>
      {adapterLabel ? (
        <div className="gpu-hud-accent">adapter {adapterLabel}</div>
      ) : null}
      {profile && profile.sampleCount > 0 ? (
        <div className={budgetClass}>
          {fmtFps(profile.fps)} fps · avg {fmtMs(profile.avgCpuMs)} / p95 {fmtMs(profile.p95CpuMs)} / max{' '}
          {fmtMs(profile.maxCpuMs)} ms · target {fmtMs(profile.targetFrameMs)}
          {profile.overBudget ? ' · OVER' : ' · ok'}
        </div>
      ) : (
        <div className="gpu-hud-muted">profiling…</div>
      )}
      <div>
        seq {stats.appliedSequence} · dropped stale {stats.droppedStale}
        {stats.pendingSequence != null ? ` · pending ${stats.pendingSequence}` : ''}
        {particleBudget != null ? ` · particles ≤ ${particleBudget.toLocaleString()}` : ''}
      </div>
      <div className="gpu-hud-muted">
        passes ({passIds.length}): {passIds.join(', ')}
      </div>
      <div className="gpu-hud-soft">Modeled phenomenology — not medical advice.</div>
    </div>
  )
}
