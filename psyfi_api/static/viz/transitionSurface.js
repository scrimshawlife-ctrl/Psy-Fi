/**
 * PsyFi safety-clamped transition helpers (presentation only).
 *
 * Soft crossfades for phase change, Neutral entry/exit, and journey load.
 * Does NOT alter ParameterField schema. Final luminance still goes through
 * SafetyPass on each side before blend.
 *
 * OBSERVED: user phase / Neutral / journey actions.
 * INFERRED: timed blend progress.
 */
(function (global) {
  'use strict';

  const KINDS = ['off', 'phase', 'neutral_in', 'neutral_out', 'journey', 'load'];

  const DURATIONS_MS = {
    phase: 320,
    neutral_in: 220,
    neutral_out: 380,
    journey: 450,
    load: 450,
  };

  function clamp01(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  function normalizeKind(kind) {
    const k = String(kind || 'off').toLowerCase();
    return KINDS.indexOf(k) >= 0 ? k : 'off';
  }

  function durationFor(kind, reduceMotion) {
    if (reduceMotion) return 0;
    const k = normalizeKind(kind);
    return DURATIONS_MS[k] != null ? DURATIONS_MS[k] : 0;
  }

  function shouldReduceMotion(frame) {
    if (frame && frame.reduce_motion) return true;
    try {
      return !!(
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch (_e) {
      return false;
    }
  }

  /** Smoothstep ease in [0,1]. */
  function ease(t) {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  }

  /**
   * Progress 0→1 from start timestamp. Returns 1 when finished / zero duration.
   */
  function progress(nowMs, startMs, durationMs) {
    const d = Math.max(0, Number(durationMs) || 0);
    if (d <= 0) return 1;
    return ease((Number(nowMs) - Number(startMs)) / d);
  }

  function isActive(nowMs, startMs, durationMs) {
    const d = Math.max(0, Number(durationMs) || 0);
    if (d <= 0) return false;
    return Number(nowMs) - Number(startMs) < d;
  }

  /**
   * Crossfade two ImageData buffers (same size). Both should already be SafetyPass'd.
   * Out may be one of the inputs or a third buffer.
   */
  function compositeCrossfade(fromData, toData, t, width, height, outData) {
    const mix = clamp01(t);
    const w = width | 0;
    const h = height | 0;
    const out =
      outData ||
      (typeof ImageData !== 'undefined'
        ? new ImageData(w, h)
        : { data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
    const a = fromData && fromData.data;
    const b = toData && toData.data;
    const d = out.data;
    if (!a || !b || !d || a.length !== d.length || b.length !== d.length) return toData || fromData;
    const inv = 1 - mix;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = (a[i] * inv + b[i] * mix + 0.5) | 0;
      d[i + 1] = (a[i + 1] * inv + b[i + 1] * mix + 0.5) | 0;
      d[i + 2] = (a[i + 2] * inv + b[i + 2] * mix + 0.5) | 0;
      d[i + 3] = 255;
    }
    return out;
  }

  function makeTransitionState(fromFrame, kind, nowMs, reduceMotion) {
    const k = normalizeKind(kind);
    if (k === 'off' || !fromFrame) {
      return { active: false, kind: 'off', from: null, start: 0, duration: 0 };
    }
    const reduce = reduceMotion != null ? !!reduceMotion : shouldReduceMotion(fromFrame);
    const duration = durationFor(k, reduce);
    if (duration <= 0) {
      return { active: false, kind: k, from: null, start: 0, duration: 0 };
    }
    return {
      active: true,
      kind: k,
      from: fromFrame,
      start: Number(nowMs) || performance.now(),
      duration,
    };
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.transitionSurface = {
    KINDS,
    DURATIONS_MS,
    clamp01,
    normalizeKind,
    durationFor,
    shouldReduceMotion,
    ease,
    progress,
    isActive,
    compositeCrossfade,
    makeTransitionState,
    SCHEMA: 'psyfi.transitionSurface.v1',
  };
})(window);
