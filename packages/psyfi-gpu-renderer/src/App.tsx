import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnalysisPublisher } from './bridge/AnalysisPublisher'
import { SnapshotStore } from './bridge/SnapshotStore'
import { SnapshotInterpolator } from './bridge/SnapshotInterpolator'
import { PsyFiGPUCanvas } from './Renderer/PsyFiGPUCanvas'
import { DebugHud } from './DebugOverlay/DebugHud'
import {
  normalizeTier,
  probeDeviceCaps,
  refineBatteryCaps,
  resolveTier,
  type DeviceCaps,
  type QualityTier,
} from './contracts/QualityTier'
import { enabledPasses } from './contracts/RenderGraph'
import type { SceneSnapshotV1 } from './contracts/SceneSnapshot'

export function App() {
  const store = useMemo(() => new SnapshotStore(), [])
  const interpolator = useMemo(() => new SnapshotInterpolator(), [])
  const publisher = useMemo(() => new AnalysisPublisher(store), [store])
  const [caps, setCaps] = useState<DeviceCaps>(() => probeDeviceCaps())

  const [tier, setTier] = useState<QualityTier>(() =>
    resolveTier('balanced', probeDeviceCaps()),
  )
  const [snapshot, setSnapshot] = useState<SceneSnapshotV1 | null>(null)
  const [status, setStatus] = useState('Idle')
  const [substance, setSubstance] = useState('lsd')
  const [mode, setMode] = useState('open')
  const [intensity, setIntensity] = useState(0.75)
  const [seed, setSeed] = useState(42)
  const [showHud, setShowHud] = useState(true)
  const [stats, setStats] = useState(store.stats())

  const effectiveTier = resolveTier(tier, caps)
  const passes = enabledPasses(effectiveTier, caps)

  const refresh = useCallback(async () => {
    setStatus('Publishing scene snapshot…')
    try {
      const snap = await publisher.publish({
        substance,
        mode,
        intensity,
        seed,
        quality_tier: tier,
        include_simulation: true,
        reduce_motion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      })
      if (snap) {
        const pending = store.takePending()
        if (pending) {
          interpolator.setTarget(pending)
          setSnapshot(interpolator.sample())
        }
        setStatus(`Snapshot ${snap.sequence} · ${snap.snapshot_id.slice(0, 8)}`)
      }
      setStats(store.stats())
    } catch (err) {
      console.error(err)
      setStatus(err instanceof Error ? err.message : 'Publish failed')
    }
  }, [publisher, store, interpolator, substance, mode, intensity, seed, tier])

  useEffect(() => {
    void refineBatteryCaps(probeDeviceCaps()).then((next) => {
      setCaps(next)
      setTier((prev) => resolveTier(prev, next))
    })
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const pending = store.takePending()
      if (pending) interpolator.setTarget(pending)
      const sample = interpolator.tick(dt)
      if (sample) setSnapshot(sample)
      setStats(store.stats())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [store, interpolator])

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(99,243,232,0.18)',
        }}
      >
        <strong style={{ letterSpacing: '0.04em' }}>PsyFi GPU</strong>
        <span style={{ color: '#8aa8a4', fontSize: 13 }}>{status}</span>
        <label>
          Substance{' '}
          <select value={substance} onChange={(e) => setSubstance(e.target.value)}>
            {['lsd', 'psilocybin', 'dmt', 'mescaline', 'ketamine', '5-meo-dmt', 'mdma', '2c-b', '2c-e', 'al-lad', 'mxe'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mode{' '}
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            {['open', 'attractor', 'void', 'power'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          Intensity{' '}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
        </label>
        <label>
          Seed{' '}
          <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} style={{ width: 90 }} />
        </label>
        <label>
          Tier{' '}
          <select
            value={tier}
            onChange={(e) => setTier(normalizeTier(e.target.value))}
          >
            {['ultra', 'high', 'balanced', 'battery'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void refresh()}>
          Publish snapshot
        </button>
        <button type="button" onClick={() => setShowHud((v) => !v)}>
          HUD
        </button>
        <a href="/" style={{ marginLeft: 'auto', fontSize: 13 }}>
          Legacy shell
        </a>
      </header>
      <div style={{ position: 'relative', minHeight: 0 }}>
        {caps.webgpu ? (
          <PsyFiGPUCanvas snapshot={snapshot} tier={effectiveTier} />
        ) : (
          <div style={{ padding: 24, color: '#8aa8a4' }}>
            <p>WebGPU is not available in this browser.</p>
            <p>
              Use the <a href="/">legacy Live Experience</a> (Canvas / WebGL) or try Chrome / Safari with
              WebGPU enabled.
            </p>
          </div>
        )}
        {showHud ? (
          <DebugHud tier={effectiveTier} stats={stats} passIds={passes} webgpu={caps.webgpu} />
        ) : null}
      </div>
    </div>
  )
}
