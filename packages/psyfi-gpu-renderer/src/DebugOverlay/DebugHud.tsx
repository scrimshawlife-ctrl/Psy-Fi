import type { SnapshotStoreStats } from '../bridge/SnapshotStore'
import type { QualityTier } from '../contracts/QualityTier'

export function DebugHud({
  tier,
  stats,
  passIds,
  webgpu,
  adapterLabel,
  vendorLabel,
  perfBand,
}: {
  tier: QualityTier
  stats: SnapshotStoreStats
  passIds: string[]
  webgpu: boolean
  adapterLabel?: string
  /** nvidia | amd | intel | apple | unknown */
  vendorLabel?: string
  perfBand?: string
}) {
  const vendorTag =
    vendorLabel && vendorLabel !== 'unknown' ? ` · ${vendorLabel.toUpperCase()}` : ''
  const bandTag = perfBand && perfBand !== 'unknown' ? ` · band ${perfBand}` : ''
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
        maxWidth: 420,
        pointerEvents: 'none',
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
      <div>
        seq {stats.appliedSequence} · dropped stale {stats.droppedStale}
        {stats.pendingSequence != null ? ` · pending ${stats.pendingSequence}` : ''}
      </div>
      <div style={{ color: '#8aa8a4' }}>
        passes {passIds.length}: {passIds.slice(0, 6).join(', ')}…
      </div>
      <div style={{ color: '#8aa8a4' }}>Modeled phenomenology — not medical advice.</div>
    </div>
  )
}
