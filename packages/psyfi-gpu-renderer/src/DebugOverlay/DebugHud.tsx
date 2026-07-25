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
  const budgetColor = profile?.overBudget ? '#ffb4a8' : '#9fd9d2'
  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        padding: '8px 10px',
        fontSize: 12,
        lineHeight: 1.45,
        background: 'rgba(7,7,11,0.72)',
        border: '1px solid rgba(99,243,232,0.25)',
        color: '#e8f7f5',
        maxWidth: 460,
        pointerEvents: 'none',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      }}
    >
      <div>
        <strong>GPU platform</strong> · tier {tier} · {webgpu ? 'WebGPU ok' : 'no navigator.gpu'}
        {vendorTag}
        {bandTag}
      </div>
      {adapterLabel ? (
        <div style={{ color: '#9fd9d2' }}>adapter {adapterLabel}</div>
      ) : null}
      {profile && profile.sampleCount > 0 ? (
        <div style={{ color: budgetColor }}>
          {fmtFps(profile.fps)} fps · avg {fmtMs(profile.avgCpuMs)} / p95 {fmtMs(profile.p95CpuMs)} / max{' '}
          {fmtMs(profile.maxCpuMs)} ms · target {fmtMs(profile.targetFrameMs)}
          {profile.overBudget ? ' · OVER' : ' · ok'}
        </div>
      ) : (
        <div style={{ color: '#8aa8a4' }}>profiling…</div>
      )}
      <div>
        seq {stats.appliedSequence} · dropped stale {stats.droppedStale}
        {stats.pendingSequence != null ? ` · pending ${stats.pendingSequence}` : ''}
        {particleBudget != null ? ` · particles ≤ ${particleBudget.toLocaleString()}` : ''}
      </div>
      <div style={{ color: '#8aa8a4', wordBreak: 'break-word' }}>
        passes ({passIds.length}): {passIds.join(', ')}
      </div>
      <div style={{ color: '#8aa8a4' }}>Modeled phenomenology — not medical advice.</div>
    </div>
  )
}
