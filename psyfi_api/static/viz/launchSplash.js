/**
 * Launch splash — scans device/runtime components before revealing the workspace.
 * Feature-detect only (no permission prompts). Opt-in meters stay in Live Experience.
 */
(function (global) {
  'use strict';

  const SESSION_KEY = 'psyfi.launch.v1.completed';
  const RESOLUTION_KEY = 'psyfi.resolution.v1';

  const FIELD_RESOLUTIONS = [
    { value: '32x32', width: 32, height: 32, label: '32 × 32 — Quick', steps: 10 },
    { value: '64x64', width: 64, height: 64, label: '64 × 64 — Standard', steps: 20 },
    { value: '128x128', width: 128, height: 128, label: '128 × 128 — Detailed', steps: 50 },
    { value: '256x256', width: 256, height: 256, label: '256 × 256 — Deep', steps: 100 },
    { value: '512x512', width: 512, height: 512, label: '512 × 512 — Max', steps: 100 },
  ];

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function probeHealth() {
    try {
      const res = await fetch('/health', { cache: 'no-store' });
      if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
      const body = await res.json().catch(() => ({}));
      return { ok: body.status === 'healthy' || res.ok, detail: body.status || 'ok' };
    } catch (err) {
      return { ok: false, detail: err.message || 'unreachable' };
    }
  }

  function suggestResolution(monitor) {
    const px = Math.max(Number(monitor && monitor.width) || 0, Number(monitor && monitor.height) || 0);
    if (px >= 2560) return '256x256';
    if (px >= 1600) return '128x128';
    if (px >= 1024) return '64x64';
    return '32x32';
  }

  function applyFieldResolution(value, { syncSteps } = { syncSteps: true }) {
    const preset = FIELD_RESOLUTIONS.find((r) => r.value === value);
    if (!preset) return null;
    const widthEl = document.getElementById('width');
    const heightEl = document.getElementById('height');
    const stepsEl = document.getElementById('steps');
    const resSelect = document.getElementById('resolutionSelect');
    const launchSelect = document.getElementById('launchResolutionSelect');
    if (widthEl) widthEl.value = String(preset.width);
    if (heightEl) heightEl.value = String(preset.height);
    if (syncSteps && stepsEl) stepsEl.value = String(preset.steps);
    if (resSelect) resSelect.value = preset.value;
    if (launchSelect && launchSelect.value !== preset.value) launchSelect.value = preset.value;
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      const map = { '32x32': 'quick', '64x64': 'standard', '128x128': 'detailed', '256x256': 'deep' };
      btn.classList.toggle('active', btn.dataset.preset === map[preset.value]);
    });
    try {
      sessionStorage.setItem(RESOLUTION_KEY, preset.value);
    } catch (_e) {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent('psyfi:resolution-change', {
        detail: { value: preset.value, width: preset.width, height: preset.height, steps: preset.steps },
      }),
    );
    return preset;
  }

  function buildChecks() {
    const sensors =
      global.PsyFiViz && typeof global.PsyFiViz.probeSensorCapabilities === 'function'
        ? global.PsyFiViz.probeSensorCapabilities()
        : {};
    const canvas = document.createElement('canvas');
    let gpuProbePromise = null;
    const getGpuProbe = () => {
      if (!gpuProbePromise) {
        gpuProbePromise =
          global.PsyFiViz && typeof global.PsyFiViz.probeGpu === 'function'
            ? global.PsyFiViz.probeGpu()
            : Promise.resolve({
                ok: !!(navigator.gpu && typeof navigator.gpu.requestAdapter === 'function'),
                webgpu: !!(navigator.gpu && typeof navigator.gpu.requestAdapter === 'function'),
                detail: 'feature probe only',
              });
      }
      return gpuProbePromise;
    };
    return [
      {
        id: 'api',
        label: 'API / health',
        run: async () => probeHealth(),
      },
      {
        id: 'monitor',
        label: 'Monitor / display',
        run: async () => {
          if (global.PsyFiViz && typeof global.PsyFiViz.probeMonitor === 'function') {
            return global.PsyFiViz.probeMonitor();
          }
          const w = (global.screen && global.screen.width) || 0;
          const h = (global.screen && global.screen.height) || 0;
          return { ok: w > 0 && h > 0, detail: w && h ? `${w}×${h}` : 'unavailable' };
        },
      },
      {
        id: 'gpu',
        label: 'GPU adapter',
        run: async () => getGpuProbe(),
      },
      {
        id: 'canvas2d',
        label: 'Canvas 2D field',
        run: async () => ({ ok: !!(canvas.getContext && canvas.getContext('2d')), detail: 'raster path' }),
      },
      {
        id: 'webgl',
        label: 'WebGL ParameterField',
        run: async () => ({
          ok: !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
          detail: 'optional Live Experience path',
        }),
      },
      {
        id: 'webgpu',
        label: 'WebGPU / GPU Lab',
        run: async () => {
          const gpu = await getGpuProbe();
          return {
            ok: !!gpu.webgpu,
            detail: gpu.webgpu ? '/gpu/ adapter ready' : 'optional separate route',
            webgpu: !!gpu.webgpu,
          };
        },
      },
      {
        id: 'worker',
        label: 'Web Worker rasterizer',
        run: async () => ({ ok: typeof Worker !== 'undefined', detail: 'off-main-thread heatmap' }),
      },
      {
        id: 'idb',
        label: 'IndexedDB history',
        run: async () => ({ ok: !!global.indexedDB, detail: 'session restore' }),
      },
      {
        id: 'sw',
        label: 'Service Worker',
        run: async () => ({ ok: 'serviceWorker' in navigator, detail: 'installable shell' }),
      },
      {
        id: 'camera',
        label: 'Camera API',
        run: async () => ({
          ok: !!sensors.camera,
          detail: sensors.camera ? 'opt-in luminance meter' : 'manual slider fallback',
        }),
      },
      {
        id: 'mic',
        label: 'Microphone API',
        run: async () => ({
          ok: !!sensors.microphone,
          detail: sensors.microphone ? 'opt-in audio meter' : 'manual slider fallback',
        }),
      },
      {
        id: 'motion',
        label: 'DeviceMotion / Orientation',
        run: async () => ({
          ok: !!(sensors.deviceMotion || sensors.deviceOrientation),
          detail: sensors.motionNeedsGesture ? 'needs gesture to enable' : 'available for opt-in',
        }),
      },
      {
        id: 'midi',
        label: 'Web MIDI',
        run: async () => ({
          ok: !!sensors.webMidi,
          detail: sensors.webMidi ? 'browser MIDI meter' : 'REST MIDI / manual slider',
        }),
      },
      {
        id: 'gamepad',
        label: 'Gamepad',
        run: async () => ({
          ok: !!sensors.gamepad,
          detail: sensors.gamepad ? 'maps into motion channel' : 'unavailable',
        }),
      },
      {
        id: 'ambient',
        label: 'Ambient light',
        run: async () => ({
          ok: !!sensors.ambientLight,
          detail: sensors.ambientLight ? 'maps into camera channel' : 'unavailable',
        }),
      },
      {
        id: 'haptics',
        label: 'Vibration / haptics',
        run: async () => ({
          ok: !!sensors.vibrate,
          detail: sensors.vibrate ? 'opt-in pulse modulator' : 'visual-only feedback',
        }),
      },
    ];
  }

  class LaunchSplash {
    constructor() {
      this.root = document.getElementById('launchSplash');
      this.list = document.getElementById('launchScanList');
      this.status = document.getElementById('launchScanStatus');
      this.enterBtn = document.getElementById('launchEnterBtn');
      this.skipBtn = document.getElementById('launchSkipBtn');
      this.resolutionSelect = document.getElementById('launchResolutionSelect');
      this.resolutionHint = document.getElementById('launchResolutionHint');
      this.results = [];
      this.done = false;
      this._resolutionTouched = false;
    }

    setStatus(text) {
      if (this.status) this.status.textContent = text;
    }

    renderItem(check, state, detail) {
      let li = this.list && this.list.querySelector(`[data-id="${check.id}"]`);
      if (!li && this.list) {
        li = document.createElement('li');
        li.dataset.id = check.id;
        this.list.appendChild(li);
      }
      if (!li) return;
      li.dataset.state = state;
      const mark = state === 'ok' ? 'ready' : state === 'miss' ? 'absent' : state === 'err' ? 'error' : 'scanning';
      li.innerHTML = `<span class="launch-scan-label">${check.label}</span><span class="launch-scan-mark">${mark}</span><span class="launch-scan-detail">${detail || ''}</span>`;
    }

    async runScan() {
      if (!this.root || !this.list) return [];
      this.list.innerHTML = '';
      this.results = [];
      const checks = buildChecks();
      this.setStatus(`Scanning ${checks.length} components…`);
      for (const check of checks) {
        this.renderItem(check, 'run', '…');
        await delay(70);
        try {
          const result = await Promise.race([
            check.run(),
            delay(2500).then(() => ({ ok: false, detail: 'timeout' })),
          ]);
          const ok = !!(result && result.ok);
          this.renderItem(check, ok ? 'ok' : 'miss', (result && result.detail) || '');
          this.results.push({
            id: check.id,
            label: check.label,
            ok,
            detail: (result && result.detail) || '',
            raw: result || null,
          });
        } catch (err) {
          this.renderItem(check, 'err', err.message || 'failed');
          this.results.push({ id: check.id, label: check.label, ok: false, detail: err.message || 'failed', raw: null });
        }
      }
      const ready = this.results.filter((r) => r.ok).length;
      this.setStatus(`Scan complete · ${ready}/${this.results.length} components ready`);
      const monitor = this.results.find((r) => r.id === 'monitor');
      if (monitor && monitor.ok && this.resolutionHint) {
        this.resolutionHint.textContent = `Display ${monitor.detail}. Sets the simulation grid used after Enter.`;
      }
      if (!this._resolutionTouched && monitor && monitor.ok) {
        const suggested = suggestResolution(monitor.raw || {});
        // Prefer stored choice, else monitor-sized suggestion.
        let stored = '';
        try {
          stored = sessionStorage.getItem(RESOLUTION_KEY) || '';
        } catch (_e) {
          stored = '';
        }
        const next = FIELD_RESOLUTIONS.some((r) => r.value === stored) ? stored : suggested;
        if (this.resolutionSelect) this.resolutionSelect.value = next;
      }
      if (this.enterBtn) this.enterBtn.disabled = false;
      this.done = true;
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ at: Date.now(), ready, total: this.results.length }),
        );
      } catch (_e) {
        /* ignore */
      }
      return this.results;
    }

    enter() {
      const value =
        (this.resolutionSelect && this.resolutionSelect.value) ||
        (() => {
          try {
            return sessionStorage.getItem(RESOLUTION_KEY) || '64x64';
          } catch (_e) {
            return '64x64';
          }
        })();
      applyFieldResolution(value, { syncSteps: true });
      document.body.classList.remove('launch-pending');
      document.body.classList.add('launch-ready');
      if (this.root) {
        this.root.hidden = true;
        this.root.setAttribute('aria-hidden', 'true');
      }
      const shell = document.getElementById('appShell');
      if (shell) shell.removeAttribute('aria-hidden');
      // Re-run capability table now that splash finished.
      if (typeof global.PsyFiBoot !== 'undefined' && typeof global.PsyFiBoot.onLaunchReady === 'function') {
        global.PsyFiBoot.onLaunchReady(this.results);
      }
      window.dispatchEvent(new CustomEvent('psyfi:launch-ready', { detail: { results: this.results } }));
    }

    bind() {
      this.enterBtn?.addEventListener('click', () => this.enter());
      this.skipBtn?.addEventListener('click', () => {
        this.setStatus('Scan skipped · enter when ready');
        if (this.enterBtn) this.enterBtn.disabled = false;
        this.enter();
      });
      this.resolutionSelect?.addEventListener('change', () => {
        this._resolutionTouched = true;
        applyFieldResolution(this.resolutionSelect.value, { syncSteps: true });
      });
    }

    async start() {
      if (!this.root) {
        document.body.classList.remove('launch-pending');
        return;
      }
      this.bind();
      // Always scan on cold load so the user sees device components first.
      await this.runScan();
    }
  }

  function boot() {
    const splash = new LaunchSplash();
    global.PsyFiViz = global.PsyFiViz || {};
    global.PsyFiViz.LaunchSplash = LaunchSplash;
    global.PsyFiViz.FIELD_RESOLUTIONS = FIELD_RESOLUTIONS;
    global.PsyFiViz.applyFieldResolution = applyFieldResolution;
    global.PsyFiBoot = global.PsyFiBoot || {};
    splash.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
