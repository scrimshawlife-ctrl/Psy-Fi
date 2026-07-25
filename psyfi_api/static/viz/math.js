/**
 * Shared deterministic field math for PsyFi visual engines.
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
    const h = (hex || '#3ee7f2').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
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

  function fbm(x, y, seed, octaves) {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    const n = Math.max(3, Math.min(7, octaves == null ? 5 : octaves | 0));
    for (let i = 0; i < n; i++) {
      sum += amp * valueNoise(x * freq, y * freq, seed + i * 1013);
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  }

  function radPhase(x, y, seed) {
    return fbm(x, y, seed + 99, 4) * Math.PI * 2;
  }

  /**
   * Bounded Mandelbox-style fold + orbit trap (Canvas fractal kernel).
   * Returns { x, y, trap, escape } with UV kept in a displayable range.
   */
  /**
   * Resolve draw LOD from ParameterField quality_tier + adaptive drop (0–2).
   * Does not alter ParameterField authority — visual cost only.
   */
  function resolveRenderLod(qualityTier, adaptiveDrop) {
    const tier = String(qualityTier || 'balanced').toLowerCase();
    let level = 2; // balanced
    if (tier === 'survival') level = 0;
    else if (tier === 'efficient') level = 1;
    const drop = Math.max(0, Math.min(2, adaptiveDrop | 0));
    level = Math.max(0, level - drop);
    const table = [
      {
        level: 0,
        name: 'survival',
        foldIters: 3,
        fbmOctaves: 3,
        canvasDiv: 3.4,
        canvasMinW: 96,
        canvasMaxW: 180,
        canvasMinH: 64,
        canvasMaxH: 120,
        trailScale: 0.35,
        chromaScale: 0,
        deepDetail: false,
        latticeDetail: false,
      },
      {
        level: 1,
        name: 'efficient',
        foldIters: 4,
        fbmOctaves: 4,
        canvasDiv: 2.7,
        canvasMinW: 120,
        canvasMaxW: 280,
        canvasMinH: 80,
        canvasMaxH: 180,
        trailScale: 0.65,
        chromaScale: 0.7,
        deepDetail: false,
        latticeDetail: true,
      },
      {
        level: 2,
        name: 'balanced',
        foldIters: 6,
        fbmOctaves: 6,
        canvasDiv: 2.1,
        canvasMinW: 140,
        canvasMaxW: 420,
        canvasMinH: 90,
        canvasMaxH: 280,
        trailScale: 1,
        chromaScale: 1,
        deepDetail: true,
        latticeDetail: true,
      },
    ];
    return table[level];
  }

  function fractalFold(x, y, ctx) {
    const want = 3 + Math.min(5, Math.floor((ctx.recursion || 0) * 5 + (ctx.complex || 0) * 2));
    const cap = ctx.foldIters != null ? ctx.foldIters | 0 : want;
    const iters = Math.max(2, Math.min(want, cap));
    const scale = 1.35 + (ctx.recursion || 0) * 0.85;
    const cx = Math.sin((ctx.time || 0) * 0.11 + (ctx.seed || 0) * 0.001) * (0.28 + (ctx.feedback || 0) * 0.45);
    const cy = Math.cos((ctx.time || 0) * 0.09) * (0.22 + (ctx.depth || 0) * 0.4);
    const spin = (ctx.time || 0) * (0.08 + (ctx.feedback || 0) * 0.25);
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);
    let zx = x;
    let zy = y;
    let trap = 1e9;
    let escape = 0;
    for (let i = 0; i < iters; i++) {
      zx = Math.abs(zx);
      zy = Math.abs(zy);
      if (zx > 1) zx = 2 - zx;
      if (zy > 1) zy = 2 - zy;
      let rx = (zx * cs - zy * sn) * scale + cx;
      let ry = (zx * sn + zy * cs) * scale + cy;
      const r2 = rx * rx + ry * ry;
      if (r2 < 0.5) {
        rx *= 2;
        ry *= 2;
      } else if (r2 < 1) {
        const inv = 1 / r2;
        rx *= inv;
        ry *= inv;
      }
      zx = rx;
      zy = ry;
      const dist = Math.abs(Math.hypot(zx, zy) - (0.55 + (ctx.depth || 0) * 0.35));
      trap = Math.min(trap, dist);
      if (zx * zx + zy * zy > 12) {
        escape = (i + 1) / iters;
        break;
      }
    }
    const warp = 0.12 + (ctx.recursion || 0) * 0.18;
    return {
      x: x * (1 - warp) + Math.tanh(zx * 0.35) * warp,
      y: y * (1 - warp) + Math.tanh(zy * 0.35) * warp,
      trap: Math.exp(-trap * (3.2 + (ctx.complex || 0) * 5)),
      escape,
    };
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.math = {
    clamp,
    hash32,
    mulberry32,
    hexToRgb,
    valueNoise,
    fbm,
    radPhase,
    fractalFold,
    resolveRenderLod,
  };
})(window);
