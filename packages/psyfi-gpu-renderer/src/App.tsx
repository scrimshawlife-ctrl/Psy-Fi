import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnalysisPublisher } from './bridge/AnalysisPublisher'
import { SnapshotStore } from './bridge/SnapshotStore'
import { SnapshotInterpolator } from './bridge/SnapshotInterpolator'
import { PsyFiGPUCanvas } from './Renderer/PsyFiGPUCanvas'
import { DebugHud } from './DebugOverlay/DebugHud'
import { FrameProfiler, type FrameProfilerSummary } from './Profiling/FrameProfiler'
import {
  normalizeTier,
  probeDeviceCaps,
  recommendedTier,
  refineDeviceCaps,
  resolveTier,
  tierConfig,
  type DeviceCaps,
  type QualityTier,
} from './contracts/QualityTier'
import { enabledPasses } from './contracts/RenderGraph'
import type { SceneSnapshotV1 } from './contracts/SceneSnapshot'
import { readGpuLaunchParams } from './bridge/launchParams'
import { readImageSeedHandoff, type ImageSeedHandoffV1 } from './bridge/imageSeedHandoff'
import type { OffscreenPresentMode } from './Renderer/offscreenPresent'

export function App() {
  const launch = useMemo(() => readGpuLaunchParams(), [])
  const imageSeed = useMemo<ImageSeedHandoffV1 | null>(
    () => (launch.imageSeed ? readImageSeedHandoff() : null),
    [launch.imageSeed],
  )
  const store = useMemo(() => new SnapshotStore(), [])
  const interpolator = useMemo(() => new SnapshotInterpolator(), [])
  const publisher = useMemo(() => new AnalysisPublisher(store), [store])
  const [caps, setCaps] = useState<DeviceCaps>(() => probeDeviceCaps())

  const [tier, setTier] = useState<QualityTier>(() =>
    resolveTier(launch.tier || 'balanced', probeDeviceCaps()),
  )
  const [snapshot, setSnapshot] = useState<SceneSnapshotV1 | null>(null)
  const [status, setStatus] = useState(launch.fromShell ? 'Loading from shell…' : 'Idle')
  const [substance, setSubstance] = useState(launch.substance || imageSeed?.substance || 'lsd')
  const [mode, setMode] = useState(launch.mode || imageSeed?.mode || 'open')
  const [intensity, setIntensity] = useState(launch.intensity ?? 0.75)
  const [seed, setSeed] = useState(launch.seed ?? imageSeed?.master_seed ?? 42)
  const [showHud, setShowHud] = useState(true)
  const [stats, setStats] = useState(store.stats())
  const profiler = useMemo(() => new FrameProfiler(), [])
  const [profile, setProfile] = useState<FrameProfilerSummary | null>(null)
  const [presentMode, setPresentMode] = useState<OffscreenPresentMode>('main')
  const [fixtureAssets, setFixtureAssets] = useState(!!launch.fixtureAssets)

  const effectiveTier = resolveTier(tier, caps)
  const passes = enabledPasses(effectiveTier, caps)
  const tierCfg = tierConfig(effectiveTier)

  const refresh = useCallback(async () => {
    setStatus('Publishing scene snapshot…')
    try {
      const snap = await publisher.publish({
        substance,
        mode,
        intensity,
        seed,
        quality_tier: tier,
        experience_id: launch.experienceId ?? imageSeed?.experience_id ?? null,
        include_simulation: true,
        include_fixture_assets: fixtureAssets,
        image_hints: imageSeed?.parameter_hints ?? null,
        image_seed_png_base64: imageSeed?.conditioned_texture_png_base64 ?? null,
        modulators: imageSeed
          ? { image: Math.min(1, Math.max(0, Number(imageSeed.influence) || 0)) }
          : null,
        reduce_motion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      })
      if (snap) {
        const pending = store.takePending()
        if (pending) {
          interpolator.setTarget(pending)
          const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          setSnapshot(reduceMotion ? interpolator.snap() : interpolator.sample())
        }
        const ktxN = snap.assets?.ktx2?.length || 0
        const imgN = snap.assets?.images?.length || 0
        const bits = [
          ktxN ? `${ktxN} ktx2` : '',
          imgN ? `${imgN} image-seed` : '',
        ].filter(Boolean)
        setStatus(
          `Snapshot ${snap.sequence} · ${snap.snapshot_id.slice(0, 8)}${bits.length ? ` · ${bits.join(' · ')}` : ''}`,
        )
      }
      setStats(store.stats())
    } catch (err) {
      console.error(err)
      setStatus(err instanceof Error ? err.message : 'Publish failed')
    }
  }, [
    publisher,
    store,
    interpolator,
    substance,
    mode,
    intensity,
    seed,
    tier,
    launch.experienceId,
    fixtureAssets,
    imageSeed,
  ])

  useEffect(() => {
    void refineDeviceCaps(probeDeviceCaps()).then((next) => {
      setCaps(next)
      // Auto-select Ultra/High on high-end discrete unless shell handoff set a tier
      // or the user already left balanced.
      setTier((prev) => {
        if (launch.tier) return resolveTier(launch.tier, next)
        const suggested = recommendedTier(next)
        if (prev === 'balanced' && (suggested === 'ultra' || suggested === 'high')) {
          return resolveTier(suggested, next)
        }
        return resolveTier(prev, next)
      })
    })
  }, [launch.tier])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    profiler.reset()
    setProfile(null)
    let raf = 0
    let last = performance.now()
    let hudAcc = 0
    const reduceMotion = () =>
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const loop = (now: number) => {
      const frameStart = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const pending = store.takePending()
      if (pending) {
        interpolator.setTarget(pending)
        if (reduceMotion()) {
          const snapped = interpolator.snap()
          if (snapped) setSnapshot(snapped)
        }
      }
      if (!reduceMotion()) {
        const sample = interpolator.tick(dt)
        if (sample) setSnapshot(sample)
      }
      const st = store.stats()
      setStats(st)
      const cpuMs = Math.max(0.01, performance.now() - frameStart)
      // Prefer wall-clock frame spacing for FPS when RAF is the clock.
      const wallMs = Math.max(cpuMs, dt * 1000)
      profiler.push({
        cpuMs: wallMs,
        snapshotLagMs: 0,
        droppedStale: st.droppedStale,
        drawCalls: passes.length,
      })
      hudAcc += wallMs
      // Refresh HUD stats ~4×/sec to avoid React thrash.
      if (hudAcc >= 250) {
        hudAcc = 0
        setProfile(profiler.summary(tierCfg.targetFrameMs))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [store, interpolator, profiler, passes.length, tierCfg.targetFrameMs])

  return (
    <div className="gpu-app">
      <header className="gpu-header">
        <strong className="gpu-brand">PsyFi GPU</strong>
        <span className="gpu-status">{status}</span>
        <button type="button" onClick={() => void refresh()}>
          Publish snapshot
        </button>
        <button type="button" onClick={() => setShowHud((v) => !v)}>
          HUD
        </button>
        <details className="gpu-controls">
          <summary>Instrument</summary>
          <div className="gpu-controls-grid">
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
              <input className="gpu-seed-input" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} />
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
            <label>
              <input
                type="checkbox"
                checked={fixtureAssets}
                onChange={(e) => setFixtureAssets(e.target.checked)}
              />{' '}
              Fixture assets
            </label>
          </div>
        </details>
        <a href="/">Shell</a>
      </header>
      <div className="gpu-stage">
        {caps.webgpu ? (
          <PsyFiGPUCanvas
            snapshot={snapshot}
            tier={effectiveTier}
            preferOffscreen={launch.offscreen}
            preferWorker={launch.offscreenWorker}
            onPresentMode={setPresentMode}
          />
        ) : (
          <div className="gpu-fallback">
            <p>WebGPU is not available in this browser.</p>
            <p>
              On discrete desktops (NVIDIA RTX 30/40/50, AMD RX 6000/7000/9000, Intel Arc), use
              Chrome/Edge with current drivers and force the high-performance GPU — see{' '}
              <code>docs/DESKTOP_GPU.md</code>. Or use the <a href="/">legacy Live Experience</a>.
            </p>
          </div>
        )}
        {showHud ? (
          <DebugHud
            tier={effectiveTier}
            stats={stats}
            passIds={passes}
            webgpu={caps.webgpu}
            adapterLabel={caps.adapter.description || caps.adapter.device || caps.adapter.vendor}
            vendorLabel={caps.adapter.vendor}
            perfBand={caps.adapter.perfBand}
            profile={profile}
            particleBudget={tierCfg.particleBudget}
            presentMode={presentMode}
            fixtureAssets={!!(snapshot?.assets?.ktx2?.length)}
          />
        ) : null}
      </div>
    </div>
  )
}
