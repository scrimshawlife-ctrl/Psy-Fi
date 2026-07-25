/**
 * Canvas engine kernels. Each engine mutates uv or returns a field contribution.
 * ParameterField remains the sole authority; engines are pure visual adapters.
 */
(function (global) {
  'use strict';

  const math = () => global.PsyFiViz.math;
  const SKIP = 0.05;

  function kaleidoscope(ux, uy, weight, symmetry) {
    if (weight <= SKIP) return { ux, uy };
    let ang = Math.atan2(uy, ux);
    let rad = Math.hypot(ux, uy);
    const seg = Math.PI / symmetry;
    ang = Math.abs((ang % (2 * seg)) - seg);
    const kx = Math.cos(ang) * rad;
    const ky = Math.sin(ang) * rad;
    return { ux: ux * (1 - weight) + kx * weight, uy: uy * (1 - weight) + ky * weight };
  }

  function recursiveFeedback(ux, uy, weight, ctx) {
    if (weight <= SKIP) return { ux, uy, feedbackF: 0, orbit: 0 };
    const { fbm, radPhase, fractalFold } = math();
    const oct = ctx.fbmOctaves != null ? ctx.fbmOctaves : 5;
    const z = 1 + ctx.zoom * 1.8 * Math.sin(ctx.time * (0.4 + ctx.recursion) + radPhase(ux, uy, ctx.seed));
    let nx = ux * z;
    let ny = uy * z;
    const spin = ctx.time * (0.15 + ctx.feedback * 0.5) * (ctx.attrB > 0.5 ? 0.6 : 1.0);
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);
    const rx = nx * cs - ny * sn;
    const ry = nx * sn + ny * cs;
    nx = ux * (1 - weight) + rx * weight;
    ny = uy * (1 - weight) + ry * weight;

    // Deep fractal fold when recursion/feedback demand it (DMT/fractal styles).
    const foldAmt = Math.min(1, weight * (0.35 + ctx.recursion * 0.85 + ctx.feedback * 0.4));
    let orbit = 0;
    if (foldAmt > 0.12) {
      const fold = fractalFold(nx, ny, ctx);
      nx = nx * (1 - foldAmt) + fold.x * foldAmt;
      ny = ny * (1 - foldAmt) + fold.y * foldAmt;
      orbit = fold.trap * (0.55 + fold.escape * 0.45);
    }

    const feedbackF = fbm(
      nx * (3 + ctx.recursion * 6),
      ny * (3 + ctx.recursion * 6) - ctx.time * ctx.feedback,
      ctx.seed + 11,
      oct
    );
    let layered =
      feedbackF * (0.55 + ctx.recursion * 0.2) + orbit * (0.35 + ctx.feedback * 0.35);
    if (ctx.deepDetail !== false) {
      layered += fbm(nx * 7.5 + ctx.time * 0.2, ny * 7.5, ctx.seed + 41, Math.max(3, oct - 1)) * ctx.recursion * 0.25;
    }
    return { ux: nx, uy: ny, feedbackF: Math.min(1, layered), orbit };
  }

  function flowField(ux, uy, weight, ctx) {
    if (weight <= SKIP) return { ux, uy };
    const { fbm } = math();
    const oct = ctx.fbmOctaves != null ? ctx.fbmOctaves : 5;
    const n1 = fbm(ux * 2.2 + ctx.time * 0.15, uy * 2.2, ctx.seed, oct);
    const n2 = fbm(ux * 2.2 + 5.2, uy * 2.2 + ctx.time * 0.12, ctx.seed + 9, oct);
    const trailPull = (ctx.trail || 0) * 0.35;
    return {
      ux: ux + (n1 - 0.5) * ctx.disp * (0.9 + trailPull) * weight,
      uy: uy + (n2 - 0.5) * ctx.disp * (0.9 + trailPull) * weight,
    };
  }

  function organicBloom(ux, uy, weight, ctx) {
    if (weight <= SKIP) return 0;
    const { fbm } = math();
    const oct = ctx.fbmOctaves != null ? ctx.fbmOctaves : 5;
    let organic = fbm(ux * 1.4, uy * 1.4 + ctx.time * 0.08, ctx.seed + 3, oct);
    if (ctx.deepDetail !== false) {
      const vein = fbm(ux * 4.2, uy * 4.2 - ctx.time * 0.05, ctx.seed + 19, Math.max(3, oct - 1));
      organic = organic * 0.72 + vein * 0.28;
    }
    return Math.pow(organic, 1.2 - ctx.complex * 0.4);
  }

  function voidExpansion(ux, uy, weight, ctx) {
    if (weight <= SKIP) return 0;
    const r = Math.hypot(ux, uy);
    let voidF = Math.exp(-Math.pow((r - (0.15 + ctx.depth * 0.35 + (ctx.time * 0.03) % 0.4)) * 3.5, 2));
    return voidF * (0.4 + ctx.voidB);
  }

  function entityLattice(ux, uy, weight, ctx) {
    if (weight <= SKIP) return 0;
    const { clamp } = math();
    const lx = Math.sin(ux * (18 + ctx.complex * 40) + ctx.time * (1 + ctx.entropy));
    const ly = Math.cos(uy * (18 + ctx.complex * 40) - ctx.time * 0.8);
    const lz = Math.sin((ux + uy) * (22 + ctx.complex * 30) + ctx.time * 1.3);
    const base = Math.pow(Math.abs(lx * ly * lz), 0.35 + (1 - ctx.complex) * 0.4);

    if (ctx.latticeDetail === false) {
      return clamp(base, 0, 1);
    }

    // Hex cell lattice + radial petal rings for fractal/entity styles.
    const scale = 7 + ctx.complex * 26;
    const hx = ux * scale;
    const hy = uy * scale * 1.1547005;
    const gx = hx - Math.floor(hx + 0.5);
    const gy = hy - Math.floor(hy + 0.5);
    const edge = ctx.edge || 0.4;
    const hex = Math.exp(-Math.hypot(gx, gy) * (3.2 + edge * 5));
    const ang = Math.atan2(uy, ux);
    const petals = 0.5 + 0.5 * Math.cos(ang * (3 + Math.floor(ctx.complex * 9)) + ctx.time * 1.1);
    const rings = Math.pow(Math.abs(Math.sin(Math.hypot(ux, uy) * (10 + ctx.complex * 18) - ctx.time)), 2.2);
    return clamp(base * 0.5 + hex * 0.32 + petals * base * 0.22 + rings * 0.12 * weight, 0, 1);
  }

  function neutralView(ux, uy, time) {
    const r = Math.hypot(ux, uy);
    return 0.08 + 0.04 * Math.sin(time * 0.5 + r * 3);
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.engines = {
    kaleidoscope,
    recursiveFeedback,
    flowField,
    organicBloom,
    voidExpansion,
    entityLattice,
    neutralView,
  };
})(window);
