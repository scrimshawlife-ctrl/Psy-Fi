/**
 * Canvas engine kernels. Each engine mutates uv or returns a field contribution.
 * ParameterField remains the sole authority; engines are pure visual adapters.
 */
(function (global) {
  'use strict';

  const math = () => global.PsyFiViz.math;

  function kaleidoscope(ux, uy, weight, symmetry) {
    if (weight <= 0.05) return { ux, uy };
    let ang = Math.atan2(uy, ux);
    let rad = Math.hypot(ux, uy);
    const seg = Math.PI / symmetry;
    ang = Math.abs((ang % (2 * seg)) - seg);
    const kx = Math.cos(ang) * rad;
    const ky = Math.sin(ang) * rad;
    return { ux: ux * (1 - weight) + kx * weight, uy: uy * (1 - weight) + ky * weight };
  }

  function recursiveFeedback(ux, uy, weight, ctx) {
    if (weight <= 0.05) return { ux, uy, feedbackF: 0 };
    const { fbm, radPhase } = math();
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
    const feedbackF = fbm(
      nx * (3 + ctx.recursion * 6),
      ny * (3 + ctx.recursion * 6) - ctx.time * ctx.feedback,
      ctx.seed + 11
    );
    return { ux: nx, uy: ny, feedbackF };
  }

  function flowField(ux, uy, weight, ctx) {
    if (weight <= 0.05) return { ux, uy };
    const { fbm } = math();
    const n1 = fbm(ux * 2.2 + ctx.time * 0.15, uy * 2.2, ctx.seed);
    const n2 = fbm(ux * 2.2 + 5.2, uy * 2.2 + ctx.time * 0.12, ctx.seed + 9);
    return {
      ux: ux + (n1 - 0.5) * ctx.disp * 0.9 * weight,
      uy: uy + (n2 - 0.5) * ctx.disp * 0.9 * weight,
    };
  }

  function organicBloom(ux, uy, weight, ctx) {
    if (weight <= 0.05) return 0;
    const { fbm } = math();
    let organic = fbm(ux * 1.4, uy * 1.4 + ctx.time * 0.08, ctx.seed + 3);
    return Math.pow(organic, 1.2 - ctx.complex * 0.4);
  }

  function voidExpansion(ux, uy, weight, ctx) {
    if (weight <= 0.05) return 0;
    const r = Math.hypot(ux, uy);
    let voidF = Math.exp(-Math.pow((r - (0.15 + ctx.depth * 0.35 + (ctx.time * 0.03) % 0.4)) * 3.5, 2));
    return voidF * (0.4 + ctx.voidB);
  }

  function entityLattice(ux, uy, weight, ctx) {
    if (weight <= 0.05) return 0;
    const lx = Math.sin(ux * (18 + ctx.complex * 40) + ctx.time * (1 + ctx.entropy));
    const ly = Math.cos(uy * (18 + ctx.complex * 40) - ctx.time * 0.8);
    const lz = Math.sin((ux + uy) * (22 + ctx.complex * 30) + ctx.time * 1.3);
    return Math.pow(Math.abs(lx * ly * lz), 0.35 + (1 - ctx.complex) * 0.4);
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
