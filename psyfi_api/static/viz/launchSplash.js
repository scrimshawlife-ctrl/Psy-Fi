/**
 * Launch splash — scans device/runtime components before revealing the workspace.
 * Feature-detect only (no permission prompts). Opt-in meters stay in Live Experience.
 */
(function (global) {
  'use strict';

  const SESSION_KEY = 'psyfi.launch.v1.completed';

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

  function buildChecks() {
    const sensors =
      global.PsyFiViz && typeof global.PsyFiViz.probeSensorCapabilities === 'function'
        ? global.PsyFiViz.probeSensorCapabilities()
        : {};
    const renderer =
      global.PsyFiRenderer && typeof global.PsyFiRenderer.getRendererState === 'function'
        ? global.PsyFiRenderer.getRendererState()
        : {};
    const canvas = document.createElement('canvas');
    return [
      {
        id: 'api',
        label: 'API / health',
        run: async () => probeHealth(),
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
        run: async () => ({
          ok: !!(renderer.webgpuSupported || (navigator.gpu && typeof navigator.gpu.requestAdapter === 'function')),
          detail: renderer.webgpuSupported ? '/gpu/ ready' : 'optional separate route',
        }),
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
      this.results = [];
      this.done = false;
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
          this.results.push({ id: check.id, label: check.label, ok, detail: (result && result.detail) || '' });
        } catch (err) {
          this.renderItem(check, 'err', err.message || 'failed');
          this.results.push({ id: check.id, label: check.label, ok: false, detail: err.message || 'failed' });
        }
      }
      const ready = this.results.filter((r) => r.ok).length;
      this.setStatus(`Scan complete · ${ready}/${this.results.length} components ready`);
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
    global.PsyFiBoot = global.PsyFiBoot || {};
    splash.start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
