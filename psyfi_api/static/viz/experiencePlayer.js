/**
 * PsyFi Experience Player — Canvas render graph
 * Field is expressive; chrome stays quiet. Safety pass is non-bypassable.
 */
(function (global) {
  'use strict';

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function hash32(n) {
    n |= 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return (n ^ (n >>> 16)) >>> 0;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    const h = (hex || '#63F3E8').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  class SafetyPass {
    constructor() {
      this.lastLuma = 0.5;
      this.flashEvents = [];
    }

    apply(imageData, safety, now) {
      const d = imageData.data;
      const maxDelta = (safety && safety.max_luminance_delta) || 0.35;
      const maxFlash = (safety && safety.max_flash_hz) || 2.0;
      let sum = 0;
      for (let i = 0; i < d.length; i += 16) {
        // subsample
        sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      }
      const samples = Math.floor(d.length / 16);
      const luma = sum / (255 * Math.max(1, samples));
      const delta = Math.abs(luma - this.lastLuma);
      if (delta > maxDelta * 0.85) {
        this.flashEvents.push(now);
      }
      // keep 1s window
      this.flashEvents = this.flashEvents.filter((t) => now - t < 1000);
      const flashHz = this.flashEvents.length;
      let atten = 1.0;
      if (flashHz > maxFlash) atten *= 0.55;
      if (delta > maxDelta) atten *= 0.7;
      if (atten < 0.999) {
        for (let i = 0; i < d.length; i += 4) {
          d[i] = d[i] * atten + 12 * (1 - atten);
          d[i + 1] = d[i + 1] * atten + 12 * (1 - atten);
          d[i + 2] = d[i + 2] * atten + 14 * (1 - atten);
        }
      }
      // soft ceiling on peak channel to reduce harsh flashes
      for (let i = 0; i < d.length; i += 4) {
        const m = Math.max(d[i], d[i + 1], d[i + 2]);
        if (m > 245) {
          const s = 245 / m;
          d[i] *= s;
          d[i + 1] *= s;
          d[i + 2] *= s;
        }
      }
      this.lastLuma = luma * atten + this.lastLuma * (1 - atten);
      return imageData;
    }
  }

  class ExperienceRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.w = canvas.width;
      this.h = canvas.height;
      this.safety = new SafetyPass();
      this.frame = null;
      this.t0 = performance.now();
      this.running = false;
      this.raf = 0;
      this._buf = null;
      this.onFrameInfo = null;
    }

    setFrame(frame) {
      this.frame = frame;
    }

    resize(w, h) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
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
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      // Simulate at reduced internal resolution for performance
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
      const feedback = p.feedback_strength || 0.4;
      const recursion = p.recursion_gain || 0.35;
      const symmetry = Math.max(1, Math.floor(2 + (p.symmetry_order || 0.3) * 10));
      const turb = p.turbulence || 0.25;
      const zoom = p.zoom_velocity || 0.08;
      const disp = p.displacement || 0.2;
      const entropy = p.entropy || 0.3;
      const bloom = p.bloom || 0.25;
      const depth = p.depth_distortion || 0.35;
      const complex = p.pattern_complexity || 0.4;
      const voidB = p.void_bias || 0;
      const attrB = p.attractor_bias || 0;
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

          if (wK > 0.05 && !neutral) {
            let ang = Math.atan2(uy, ux);
            let rad = Math.hypot(ux, uy);
            const seg = Math.PI / symmetry;
            ang = Math.abs((ang % (2 * seg)) - seg);
            const kx = Math.cos(ang) * rad;
            const ky = Math.sin(ang) * rad;
            ux = ux * (1 - wK) + kx * wK;
            uy = uy * (1 - wK) + ky * wK;
          }

          if (wR > 0.05 && !neutral) {
            const z = 1 + zoom * 1.8 * Math.sin(time * (0.4 + recursion) + radPhase(ux, uy, seed));
            ux *= z;
            uy *= z;
            const spin = time * (0.15 + feedback * 0.5) * (attrB > 0.5 ? 0.6 : 1.0);
            const cs = Math.cos(spin);
            const sn = Math.sin(spin);
            const rx = ux * cs - uy * sn;
            const ry = ux * sn + uy * cs;
            ux = ux * (1 - wR) + rx * wR;
            uy = uy * (1 - wR) + ry * wR;
          }

          if (wF > 0.05 && !neutral) {
            const n1 = fbm(ux * 2.2 + time * 0.15, uy * 2.2, seed);
            const n2 = fbm(ux * 2.2 + 5.2, uy * 2.2 + time * 0.12, seed + 9);
            ux += (n1 - 0.5) * disp * 0.9 * wF;
            uy += (n2 - 0.5) * disp * 0.9 * wF;
          }

          let organic = 0;
          if (wO > 0.05 && !neutral) {
            organic = fbm(ux * 1.4, uy * 1.4 + time * 0.08, seed + 3);
            organic = Math.pow(organic, 1.2 - complex * 0.4);
          }

          let voidF = 0;
          if (wV > 0.05 && !neutral) {
            const r = Math.hypot(ux, uy);
            voidF = Math.exp(-Math.pow((r - (0.15 + depth * 0.35 + (time * 0.03) % 0.4)) * 3.5, 2));
            voidF = voidF * (0.4 + voidB);
          }

          let lattice = 0;
          if (wE > 0.05 && !neutral) {
            const lx = Math.sin(ux * (18 + complex * 40) + time * (1 + entropy));
            const ly = Math.cos(uy * (18 + complex * 40) - time * 0.8);
            const lz = Math.sin((ux + uy) * (22 + complex * 30) + time * 1.3);
            lattice = Math.pow(Math.abs(lx * ly * lz), 0.35 + (1 - complex) * 0.4);
          }

          let feedbackF = 0;
          if (wR > 0.05 && !neutral) {
            feedbackF = fbm(ux * (3 + recursion * 6), uy * (3 + recursion * 6) - time * feedback, seed + 11);
          }

          let v =
            feedbackF * wR +
            organic * wO +
            voidF * wV +
            lattice * wE +
            fbm(ux * 1.1, uy * 1.1, seed) * wF * 0.5;

          if (neutral) {
            const r = Math.hypot(ux, uy);
            v = 0.08 + 0.04 * Math.sin(time * 0.5 + r * 3);
          }

          if (attrB > 0.2 && !neutral) {
            const r = Math.hypot(ux, uy);
            v *= 0.75 + 0.55 * Math.exp(-r * (1.5 + attrB * 2));
            v += attrB * 0.15 * Math.pow(Math.max(0, 1 - r * 2), 2);
          }

          v = clamp(v * (0.7 + energy * 0.8) + turb * (rnd() - 0.5) * 0.08, 0, 1);

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
            const bAmt = bloom * Math.pow(v, 2);
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
        });
      }
    }
  }

  function radPhase(x, y, seed) {
    return fbm(x, y, seed + 99) * Math.PI * 2;
  }

  function valueNoise(x, y, seed) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const s = seed >>> 0;
    const h = (ix, iy) => {
      let n = hash32(ix * 374761393 + iy * 668265263 + s);
      return (n & 0xffff) / 0xffff;
    };
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = h(xi, yi);
    const b = h(xi + 1, yi);
    const c = h(xi, yi + 1);
    const d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y, seed) {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < 5; i++) {
      sum += amp * valueNoise(x * freq, y * freq, seed + i * 1013);
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  }

  class ExperiencePlayer {
    constructor(opts) {
      this.canvas = opts.canvas;
      this.renderer = new ExperienceRenderer(this.canvas);
      this.timeline = null;
      this.idx = 0;
      this.playing = false;
      this.phaseOverride = null;
      this.statusEl = opts.statusEl || null;
      this.provenanceEl = opts.provenanceEl || null;
      this.renderer.onFrameInfo = (info) => this._status(info);
    }

    resize() {
      const parent = this.canvas.parentElement;
      const w = Math.max(280, parent ? parent.clientWidth : 480);
      const h = Math.max(220, Math.floor(w * 0.62));
      this.renderer.resize(w, h);
    }

    async loadTimeline(payload) {
      const res = await fetch('/api/v1/visualize/parameter-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }
      const data = await res.json();
      if (data.kind === 'snapshot') {
        this.timeline = { frames: [data.frame], timeline_hash: data.frame.hash };
        this.renderer.setFrame(data.frame);
      } else {
        this.timeline = data;
        this.idx = 0;
        this.renderer.setFrame(data.frames[0]);
      }
      this._provenance(data);
      return data;
    }

    play() {
      this.playing = true;
      this.renderer.start();
      if (this._phaseTimer) clearInterval(this._phaseTimer);
      this._tickPhases();
    }

    pause() {
      this.playing = false;
      this.renderer.stop();
      if (this._phaseTimer) clearInterval(this._phaseTimer);
    }

    neutral(on) {
      if (!this.timeline || !this.timeline.frames || !this.timeline.frames.length) return;
      if (on) {
        const base = this.timeline.frames[this.idx] || this.timeline.frames[0];
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
        this.renderer.setFrame(neut);
      } else if (this.timeline.frames[this.idx]) {
        this.renderer.setFrame(this.timeline.frames[this.idx]);
      }
    }

    _tickPhases() {
      if (!this.playing || !this.timeline || !this.timeline.frames) return;
      const frames = this.timeline.frames;
      // advance slowly through timeline
      this._phaseTimer = setInterval(() => {
        if (!this.playing) {
          clearInterval(this._phaseTimer);
          return;
        }
        this.idx = (this.idx + 1) % frames.length;
        this.renderer.setFrame(frames[this.idx]);
      }, 900);
    }

    _status(info) {
      if (!this.statusEl) return;
      this.statusEl.textContent = [
        info.substance || '',
        info.mode || '',
        info.phase || '',
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
        <div><strong>Authority</strong> parameters INFERRED · motifs INFERRED · sources OBSERVED</div>
        <div class="muted">Modeled phenomenology for research/visualization only. Not medical advice.</div>
      `;
    }
  }

  global.PsyFiViz = { ExperiencePlayer, ExperienceRenderer, SafetyPass };
})(window);
