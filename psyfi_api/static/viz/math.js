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
    const h = (hex || '#63F3E8').replace('#', '');
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

  function radPhase(x, y, seed) {
    return fbm(x, y, seed + 99) * Math.PI * 2;
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.math = { clamp, hash32, mulberry32, hexToRgb, valueNoise, fbm, radPhase };
})(window);
