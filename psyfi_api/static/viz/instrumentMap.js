/**
 * PsyFi Instrument Map — presentation-layer mapping for Live Experience controls.
 *
 * I1 (Instrument & Spatiotemporal Grounding): non-linear intensity mapping and
 * optional quantization. Does NOT change ParameterField schema or SafetyPass.
 * The API still receives a linear 0–1 intensity; only the UI↔value mapping is curved.
 *
 * OBSERVED: user slider position.
 * INFERRED: mapped intensity sent to /api/v1.
 */
(function (global) {
  'use strict';

  function clamp01(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  /** Smoothstep in [0,1]. */
  function smoothstep(t) {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  }

  /**
   * UI position (linear 0–1) → intensity value sent to ParameterField.
   * Curve: more resolution in the mid–high band where phenomenological
   * change is denser; still reaches exact 0 and 1.
   *
   * Inverse-friendly power after smoothstep keeps endpoints fixed.
   */
  function intensityFromUi(t) {
    const u = clamp01(t);
    // Soft ease then mild power so mid values expand slightly.
    const eased = smoothstep(u);
    return clamp01(Math.pow(eased, 0.82));
  }

  /**
   * Intensity value → UI position for the range control.
   * Approximate inverse of intensityFromUi (binary search; exact endpoints).
   */
  function uiFromIntensity(v) {
    const target = clamp01(v);
    if (target <= 0) return 0;
    if (target >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) * 0.5;
      if (intensityFromUi(mid) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) * 0.5;
  }

  /**
   * Optional discrete stations (GL4SS-style dial). denser in the middle third.
   * stations: number of stops including endpoints (default 21).
   */
  function quantizeIntensity(v, stations) {
    const n = Math.max(2, Math.floor(Number(stations) || 21));
    const t = clamp01(v);
    // Non-uniform station spacing: compress extremes slightly.
    const stationsList = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      stationsList.push(intensityFromUi(u));
    }
    let best = stationsList[0];
    let bestD = Math.abs(t - best);
    for (let i = 1; i < stationsList.length; i++) {
      const d = Math.abs(t - stationsList[i]);
      if (d < bestD) {
        bestD = d;
        best = stationsList[i];
      }
    }
    return best;
  }

  function formatIntensity(v, digits) {
    const d = digits == null ? 2 : digits;
    return clamp01(v).toFixed(d);
  }

  /**
   * Read intensity from a range input that stores UI position.
   * dataset.mapMode: "linear" | "instrument" (default instrument).
   */
  function readIntensityFromRange(el) {
    if (!el) return 0.7;
    const ui = clamp01(el.value);
    const mode = (el.dataset && el.dataset.mapMode) || 'instrument';
    if (mode === 'linear') return ui;
    return intensityFromUi(ui);
  }

  /**
   * Write an intensity value into a range input (sets UI position).
   */
  function writeIntensityToRange(el, intensity) {
    if (!el) return;
    const mode = (el.dataset && el.dataset.mapMode) || 'instrument';
    const ui = mode === 'linear' ? clamp01(intensity) : uiFromIntensity(intensity);
    el.value = String(ui);
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.instrumentMap = {
    clamp01,
    smoothstep,
    intensityFromUi,
    uiFromIntensity,
    quantizeIntensity,
    formatIntensity,
    readIntensityFromRange,
    writeIntensityToRange,
    SCHEMA: 'psyfi.instrumentMap.v1',
  };
})(window);
