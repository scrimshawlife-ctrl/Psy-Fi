/**
 * PsyFi Experience Player — orchestrates ParameterField → engines → safety pass.
 * Canvas is default; optional WebGL ParameterField path when preferred.
 */
(function (global) {
  'use strict';

  const math = () => global.PsyFiViz.math;
  const engines = () => global.PsyFiViz.engines;

  /** Flatten visualization.field ({values[][], width, height}) for sampling. */
  function packSourceField(field, mix) {
    if (!field || !field.values || !field.width || !field.height) return null;
    const m = Number(mix);
    if (!(m > 0)) return null;
    const width = field.width | 0;
    const height = field.height | 0;
    const data = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const row = field.values[y];
      if (!row) continue;
      for (let x = 0; x < width; x++) {
        const v = Number(row[x]);
        data[y * width + x] = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
      }
    }
    return { width, height, data, mix: Math.min(1, Math.max(0, m)) };
  }

  function sampleSourcePlane(plane, nx, ny) {
    if (!plane) return 0;
    const x = Math.min(1, Math.max(0, nx)) * (plane.width - 1);
    const y = Math.min(1, Math.max(0, ny)) * (plane.height - 1);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(plane.width - 1, x0 + 1);
    const y1 = Math.min(plane.height - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;
    const i00 = plane.data[y0 * plane.width + x0];
    const i10 = plane.data[y0 * plane.width + x1];
    const i01 = plane.data[y1 * plane.width + x0];
    const i11 = plane.data[y1 * plane.width + x1];
    const a = i00 * (1 - fx) + i10 * fx;
    const b = i01 * (1 - fx) + i11 * fx;
    return a * (1 - fy) + b * fy;
  }

  class ExperienceRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.w = canvas.width;
      this.h = canvas.height;
      this.safety = new global.PsyFiViz.SafetyPass();
      this.frame = null;
      this.sourcePlane = null;
      this.t0 = performance.now();
      this.running = false;
      this.raf = 0;
      this._buf = null;
      this.onFrameInfo = null;
      this.backend = 'canvas2d';
    }

    setFrame(frame) {
      this.frame = frame;
    }

    setSourcePlane(plane) {
      this.sourcePlane = plane || null;
    }

    resize(w, h, opts) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bufferW = opts && opts.bufferW ? Math.floor(opts.bufferW) : Math.floor(w * dpr);
      const bufferH = opts && opts.bufferH ? Math.floor(opts.bufferH) : Math.floor(h * dpr);
      this.canvas.width = Math.max(16, bufferW);
      this.canvas.height = Math.max(16, bufferH);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.w = this.canvas.width;
      this.h = this.canvas.height;
      this._buf = null;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.t0 = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        this.draw(now);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    draw(now) {
      const { clamp, hexToRgb, mulberry32, hash32, fbm } = math();
      const engFns = engines();
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      const iw = Math.max(80, Math.min(220, Math.floor(w / 3)));
      const ih = Math.max(50, Math.min(140, Math.floor(h / 3)));
      if (!this._buf || this._buf.width !== iw || this._buf.height !== ih) {
        this._buf = ctx.createImageData(iw, ih);
        this._off = document.createElement('canvas');
        this._off.width = iw;
        this._off.height = ih;
        this._offCtx = this._off.getContext('2d', { alpha: false });
      }
      const img = this._buf;
      const d = img.data;
      const f = this.frame || {};
      const p = f.parameters || {};
      const eng = f.engines || {};
      const pal = hexToRgb((f.palette && f.palette.tracers) || '#63F3E8');
      const seed = (f.master_seed || 42) >>> 0;
      const rnd = mulberry32(hash32(seed + 17));
      const time = (now - this.t0) / 1000;

      const engineCtx = {
        time,
        seed,
        feedback: p.feedback_strength || 0.4,
        recursion: p.recursion_gain || 0.35,
        turb: p.turbulence || 0.25,
        zoom: p.zoom_velocity || 0.08,
        disp: p.displacement || 0.2,
        entropy: p.entropy || 0.3,
        bloom: p.bloom || 0.25,
        depth: p.depth_distortion || 0.35,
        complex: p.pattern_complexity || 0.4,
        voidB: p.void_bias || 0,
        attrB: p.attractor_bias || 0,
      };
      const symmetry = Math.max(1, Math.floor(2 + (p.symmetry_order || 0.3) * 10));
      const energy = (f.palette && f.palette.energy) || p.palette_energy || 0.5;
      const wR = eng.recursive_feedback || 0.3;
      const wK = eng.kaleidoscope || 0.2;
      const wF = eng.flow_field || 0.2;
      const wO = eng.organic_bloom || 0.2;
      const wV = eng.void_expansion || 0.15;
      const wE = eng.entity_lattice || 0.1;
      const wN = eng.neutral_view || 0.0;
      const neutral = !!f.neutral_view || wN > 0.8;
      const cx = iw * 0.5;
      const cy = ih * 0.5;
      const invMin = 1 / Math.min(iw, ih);

      for (let y = 0; y < ih; y++) {
        for (let x = 0; x < iw; x++) {
          let ux = (x - cx) * invMin;
          let uy = (y - cy) * invMin;
          let feedbackF = 0;
          let organic = 0;
          let voidF = 0;
          let lattice = 0;

          if (!neutral) {
            ({ ux, uy } = engFns.kaleidoscope(ux, uy, wK, symmetry));
            const rf = engFns.recursiveFeedback(ux, uy, wR, engineCtx);
            ux = rf.ux;
            uy = rf.uy;
            feedbackF = rf.feedbackF || 0;
            ({ ux, uy } = engFns.flowField(ux, uy, wF, engineCtx));
            organic = engFns.organicBloom(ux, uy, wO, engineCtx);
            voidF = engFns.voidExpansion(ux, uy, wV, engineCtx);
            lattice = engFns.entityLattice(ux, uy, wE, engineCtx);
          }

          let v = neutral
            ? engFns.neutralView(ux, uy, time)
            : feedbackF * wR +
              organic * wO +
              voidF * wV +
              lattice * wE +
              fbm(ux * 1.1, uy * 1.1, seed) * wF * 0.5;

          if (engineCtx.attrB > 0.2 && !neutral) {
            const r = Math.hypot(ux, uy);
            v *= 0.75 + 0.55 * Math.exp(-r * (1.5 + engineCtx.attrB * 2));
            v += engineCtx.attrB * 0.15 * Math.pow(Math.max(0, 1 - r * 2), 2);
          }

          v = clamp(v * (0.7 + energy * 0.8) + engineCtx.turb * (rnd() - 0.5) * 0.08, 0, 1);

          // Optional last-sim magnitude plane (before SafetyPass; never replaces ParameterField).
          if (!neutral && this.sourcePlane && this.sourcePlane.mix > 0) {
            const src = sampleSourcePlane(this.sourcePlane, x / Math.max(1, iw - 1), y / Math.max(1, ih - 1));
            v = clamp(v * (1 - this.sourcePlane.mix * 0.85) + src * this.sourcePlane.mix, 0, 1);
          }

          let rC, gC, bC;
          if (neutral) {
            rC = 10 + v * 30;
            gC = 12 + v * 34;
            bC = 18 + v * 40;
          } else {
            const warm = clamp(v * 1.2, 0, 1);
            rC = pal.r * warm * (0.35 + v) + 8;
            gC = pal.g * warm * (0.4 + organic * 0.4 + v * 0.3) + 10;
            bC = pal.b * (0.45 + v * 0.7) + lattice * 80 + 12;
            const bAmt = engineCtx.bloom * Math.pow(v, 2);
            rC = rC * (1 - bAmt) + 255 * bAmt * 0.85;
            gC = gC * (1 - bAmt) + 255 * bAmt * 0.9;
            bC = bC * (1 - bAmt) + 255 * bAmt;
          }

          const idx = (y * iw + x) * 4;
          d[idx] = clamp(rC, 0, 255);
          d[idx + 1] = clamp(gC, 0, 255);
          d[idx + 2] = clamp(bC, 0, 255);
          d[idx + 3] = 255;
        }
      }

      this.safety.apply(img, f.safety || {}, now);
      this._offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#07070B';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(this._off, 0, 0, w, h);

      if (typeof this.onFrameInfo === 'function') {
        this.onFrameInfo({
          phase: f.phase,
          hash: f.hash,
          mode: f.mode,
          substance: f.substance,
          backend: this.backend,
        });
      }
    }
  }

  class ExperiencePlayer {
    constructor(opts) {
      this.canvas = opts.canvas;
      this.glCanvas = opts.glCanvas || null;
      this.preferWebGL = !!opts.preferWebGL;
      this.webgl = null;
      this.renderer = new ExperienceRenderer(this.canvas);
      if (
        this.glCanvas &&
        global.PsyFiViz.ParameterFieldWebGL &&
        global.PsyFiViz.ParameterFieldWebGL.supported()
      ) {
        this.webgl = new global.PsyFiViz.ParameterFieldWebGL(this.glCanvas);
        if (!this.webgl.ok) this.webgl = null;
      }
      this.timeline = null;
      this.idx = 0;
      this.playing = false;
      this.neutralOn = false;
      this.statusEl = opts.statusEl || null;
      this.provenanceEl = opts.provenanceEl || null;
      this.renderer.onFrameInfo = (info) => this._status(info);
      this.modulators = { camera: 0, motion: 0, midi: 0, audio: 0, haptics: 0 };
      this.loadContext = null;
      this.liveModulators = true;
      this._liveAbort = null;
      this._liveModTimer = 0;
      this._lastLiveModMs = 0;
      this.fieldBridge = null;
      this.sourcePlane = null;
      this.viewportResolution = 'auto';
      this.setPreferWebGL(this.preferWebGL);
    }

    /**
     * Viewport buffer mode: auto | native | WxH (e.g. 1280x720).
     * CSS size still fits the panel; buffer pixels follow the selection.
     */
    setViewportResolution(value) {
      this.viewportResolution = value || 'auto';
      this.resize();
    }

    /**
     * Optional simulation magnitude texture as a soft source plane.
     * @param {object|null} field visualization.field ({values,width,height}) or null to clear
     * @param {number} [mix=0.32]
     */
    setSourcePlane(field, mix) {
      const plane = packSourceField(field, mix == null ? 0.32 : mix);
      this.sourcePlane = plane;
      this.renderer.setSourcePlane(plane);
      if (this.webgl && typeof this.webgl.setSourcePlane === 'function') {
        this.webgl.setSourcePlane(plane);
      }
    }

    clearSourcePlane() {
      this.setSourcePlane(null, 0);
    }

    setSourceMix(mix) {
      if (!this.sourcePlane) return;
      const m = Math.min(1, Math.max(0, Number(mix) || 0));
      this.sourcePlane = { ...this.sourcePlane, mix: m };
      this.renderer.setSourcePlane(this.sourcePlane);
      if (this.webgl && typeof this.webgl.setSourcePlane === 'function') {
        this.webgl.setSourcePlane(this.sourcePlane);
      }
    }

    _syncCanvasVisibility() {
      const useGL = this.backend === 'webgl' && this.webgl && this.webgl.ok;
      if (this.canvas) this.canvas.hidden = !!useGL;
      if (this.glCanvas) this.glCanvas.hidden = !useGL;
    }

    setPreferWebGL(on) {
      this.preferWebGL = !!on;
      const wasPlaying = this.playing;
      this.pause();
      if (on && this.webgl && this.webgl.ok) {
        this.backend = 'webgl';
      } else {
        this.backend = 'canvas2d';
      }
      this.renderer.backend = this.backend;
      this._syncCanvasVisibility();
      if (this.timeline && this.timeline.frames && this.timeline.frames[this.idx]) {
        this.setFrame(this.timeline.frames[this.idx]);
      }
      if (wasPlaying) this.play();
    }

    resize() {
      const parent = (this.canvas && this.canvas.parentElement) || (this.glCanvas && this.glCanvas.parentElement);
      const w = Math.max(280, parent ? parent.clientWidth : 480);
      const h = Math.max(220, Math.floor(w * 0.62));
      let opts;
      const mode = this.viewportResolution || 'auto';
      if (mode === 'native') {
        const mon =
          global.PsyFiViz && typeof global.PsyFiViz.probeMonitor === 'function'
            ? global.PsyFiViz.probeMonitor()
            : { width: global.screen && global.screen.width, height: global.screen && global.screen.height };
        const bw = Math.max(320, Math.min(3840, Number(mon.width) || w));
        const bh = Math.max(200, Math.round(bw * (h / w)));
        opts = { bufferW: bw, bufferH: bh };
      } else if (/^\d+x\d+$/.test(mode)) {
        const parts = mode.split('x');
        opts = {
          bufferW: Math.max(16, parseInt(parts[0], 10) || w),
          bufferH: Math.max(16, parseInt(parts[1], 10) || h),
        };
      }
      this.renderer.resize(w, h, opts);
      if (this.webgl) this.webgl.resize(w, h, opts);
    }

    async loadTimeline(payload) {
      this.loadContext = {
        substance: payload.substance,
        experience_id: payload.experience_id || null,
        mode: payload.mode || 'open',
        intensity: payload.intensity,
        seed: payload.seed,
        reduce_motion: !!payload.reduce_motion,
        dim_flashing: !!payload.dim_flashing,
        quality_tier: payload.quality_tier || 'balanced',
      };
      const body = {
        ...payload,
        modulators: this.modulators,
      };
      const res = await fetch('/api/v1/visualize/parameter-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }
      const data = await res.json();
      if (data.kind === 'snapshot') {
        this.timeline = { frames: [data.frame], timeline_hash: data.frame.hash, seed: data.frame.master_seed };
        this.setFrame(data.frame);
      } else {
        this.timeline = data;
        this.idx = Math.min(this.idx, data.frames.length - 1);
        this.setFrame(data.frames[this.idx] || data.frames[0]);
      }
      this._provenance(data);
      return data;
    }

    setFrame(frame) {
      this.renderer.setFrame(frame);
      if (this.webgl) this.webgl.setFrame(frame);
    }

    setPhaseIndex(i) {
      if (!this.timeline || !this.timeline.frames) return;
      this.idx = Math.max(0, Math.min(this.timeline.frames.length - 1, i | 0));
      this._applyFrameForIndex(this.idx);
      const shown = this.frame || this.timeline.frames[this.idx];
      this._status({
        phase: shown.phase,
        hash: shown.hash,
        mode: shown.mode,
        substance: shown.substance,
        backend: this.backend,
      });
    }

    /** Rematerialize Neutral over the timeline frame so phase ticks cannot undo it. */
    _materializeNeutral(base) {
      const neut = JSON.parse(JSON.stringify(base));
      neut.neutral_view = true;
      neut.engines = Object.fromEntries(
        Object.keys(neut.engines || {}).map((k) => [k, k === 'neutral_view' ? 1 : 0])
      );
      if (!neut.engines.neutral_view) neut.engines.neutral_view = 1;
      Object.keys(neut.parameters || {}).forEach((k) => {
        neut.parameters[k] = k === 'stability' ? 0.98 : 0.05;
      });
      neut.parameters.flash_energy = 0;
      neut.phase = 'neutral';
      return neut;
    }

    _applyFrameForIndex(i) {
      if (!this.timeline || !this.timeline.frames) return;
      this.idx = Math.max(0, Math.min(this.timeline.frames.length - 1, i | 0));
      if (this.liveModulators && this._hasActiveModulators() && this.loadContext && !this.neutralOn) {
        this._scheduleLiveRematerialize();
        return;
      }
      const base = this.timeline.frames[this.idx];
      if (!base) return;
      const frame = this.neutralOn ? this._materializeNeutral(base) : base;
      this.frame = frame;
      this.setFrame(frame);
    }

    _hasActiveModulators() {
      const m = this.modulators || {};
      return ['camera', 'motion', 'midi', 'audio', 'haptics'].some((k) => Number(m[k] || 0) > 0.02);
    }

    _scheduleLiveRematerialize() {
      if (!this.loadContext || !this.timeline) return;
      const now = performance.now();
      const wait = Math.max(0, 320 - (now - (this._lastLiveModMs || 0)));
      if (this._liveModTimer) clearTimeout(this._liveModTimer);
      this._liveModTimer = setTimeout(() => {
        this._liveRematerialize();
      }, wait);
    }

    async _liveRematerialize() {
      if (!this.loadContext || !this.timeline || !this.timeline.frames) return;
      if (this._liveAbort) this._liveAbort.abort();
      const ac = new AbortController();
      this._liveAbort = ac;
      this._lastLiveModMs = performance.now();
      const base = this.timeline.frames[this.idx] || this.timeline.frames[0];
      const phase_t =
        base && base.phase_t != null
          ? Number(base.phase_t)
          : this.idx / Math.max(1, this.timeline.frames.length - 1);
      const body = {
        ...this.loadContext,
        phase_t,
        modulators: this.modulators,
        neutral_view: !!this.neutralOn,
      };
      try {
        const res = await fetch('/api/v1/visualize/parameter-timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (!res.ok || ac.signal.aborted) return;
        const data = await res.json();
        if (ac.signal.aborted) return;
        const frame = data.frame || (data.frames && data.frames[0]);
        if (!frame) return;
        const applied = this.neutralOn ? this._materializeNeutral(frame) : frame;
        this.frame = applied;
        this.setFrame(applied);
        this._status({
          phase: applied.phase,
          hash: applied.hash,
          mode: applied.mode,
          substance: applied.substance,
          backend: this.backend,
        });
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    play() {
      this.playing = true;
      if (this.backend === 'webgl' && this.webgl) this.webgl.start();
      else this.renderer.start();
      if (this._phaseTimer) clearInterval(this._phaseTimer);
      this._tickPhases();
    }

    pause() {
      this.playing = false;
      this.renderer.stop();
      if (this.webgl) this.webgl.stop();
      if (this._phaseTimer) clearInterval(this._phaseTimer);
    }

    neutral(on) {
      if (!this.timeline || !this.timeline.frames || !this.timeline.frames.length) return;
      this.neutralOn = !!on;
      this._applyFrameForIndex(this.idx);
    }

    setModulators(mods) {
      this.modulators = {
        camera: Number(mods.camera || 0),
        motion: Number(mods.motion || 0),
        midi: Number(mods.midi || 0),
        audio: Number(mods.audio || 0),
        haptics: Number(mods.haptics || 0),
      };
      if (this.liveModulators && this.timeline && this._hasActiveModulators()) {
        this._scheduleLiveRematerialize();
      }
    }

    exportTimelineJson() {
      if (!this.timeline) throw new Error('No timeline loaded');
      const blob = new Blob([JSON.stringify(this.timeline, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `psyfi-timeline-${this.timeline.timeline_hash || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    exportViewportPng() {
      const target =
        this.backend === 'webgl' && this.glCanvas && !this.glCanvas.hidden
          ? this.glCanvas
          : this.canvas;
      const url = target.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `psyfi-field-${Date.now()}.png`;
      a.click();
    }

    async loadFieldBridge(simPayload) {
      const res = await fetch('/api/v1/visualize/field-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simPayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }
      this.fieldBridge = await res.json();
      return this.fieldBridge;
    }

    _tickPhases() {
      if (!this.playing || !this.timeline || !this.timeline.frames) return;
      const frames = this.timeline.frames;
      this._phaseTimer = setInterval(() => {
        if (!this.playing) {
          clearInterval(this._phaseTimer);
          return;
        }
        this.idx = (this.idx + 1) % frames.length;
        this._applyFrameForIndex(this.idx);
        if (typeof this.onPhaseIndex === 'function') this.onPhaseIndex(this.idx, frames.length);
      }, 900);
    }

    _status(info) {
      if (!this.statusEl) return;
      this.statusEl.textContent = [
        info.substance || '',
        info.mode || '',
        info.phase || '',
        info.backend || this.backend,
        info.hash ? `hash ${info.hash}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
    }

    _provenance(data) {
      if (!this.provenanceEl) return;
      const frame = (data.frames && data.frames[0]) || data.frame || {};
      this.provenanceEl.innerHTML = `
        <div><strong>Timeline</strong> ${data.timeline_hash || frame.hash || '—'}</div>
        <div><strong>Seed</strong> ${data.seed ?? frame.master_seed ?? '—'}</div>
        <div><strong>Experience</strong> ${data.experience_id || frame.experience_id || '—'}</div>
        <div><strong>Backend</strong> ${this.backend}</div>
        <div><strong>Authority</strong> parameters INFERRED · motifs INFERRED · sources OBSERVED</div>
        <div class="muted">Modeled phenomenology for research/visualization only. Not medical advice.</div>
      `;
    }
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.ExperiencePlayer = ExperiencePlayer;
  global.PsyFiViz.ExperienceRenderer = ExperienceRenderer;
})(window);
