/**
 * PsyFi I2 Compare Surface — pin + dual-field hold-and-compare helpers.
 *
 * Pure presentation / orchestration helpers for ExperiencePlayer.
 * Does not alter ParameterField schema or SafetyPass.
 *
 * OBSERVED: user pin action and compare mode selection.
 * INFERRED: comparison packet hashes for provenance.
 */
(function (global) {
  'use strict';

  const MODES = ['off', 'wipe', 'blink', 'split'];

  function clamp01(x) {
    return Math.min(1, Math.max(0, Number(x) || 0));
  }

  /**
   * Create a pin packet from a ParameterField frame.
   * @param {object} frame
   * @param {number} idx
   * @param {string|null} timelineHash
   */
  function makePinPacket(frame, idx, timelineHash) {
    if (!frame) return null;
    return {
      frame: JSON.parse(JSON.stringify(frame)),
      idx: idx | 0,
      hash: frame.hash || null,
      timeline_hash: timelineHash || null,
      at: new Date().toISOString(),
    };
  }

  /**
   * Build the comparison provenance packet.
   */
  function makeComparisonPacket(pinned, liveFrame, mode, wipePosition, blinkHz) {
    if (!pinned) return null;
    return {
      mode: mode || 'off',
      pinned_hash: pinned.hash || null,
      live_hash: (liveFrame && liveFrame.hash) || null,
      pinned_at: pinned.at || null,
      wipe_position: clamp01(wipePosition),
      blink_hz: Number(blinkHz) > 0 ? Number(blinkHz) : 2,
    };
  }

  /**
   * Normalize compare mode.
   */
  function normalizeMode(mode) {
    const m = String(mode || 'off').toLowerCase();
    return MODES.includes(m) ? m : 'off';
  }

  /**
   * Composite two ImageData buffers for wipe mode.
   * Left = pinned, right = live. Edge at wipePosition (0..1).
   */
  function compositeWipe(pinnedData, liveData, wipePosition, width, height) {
    const out = new ImageData(width, height);
    const edge = Math.floor(clamp01(wipePosition) * width);
    const pd = pinnedData.data;
    const ld = liveData.data;
    const od = out.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const src = x < edge ? pd : ld;
        od[i] = src[i];
        od[i + 1] = src[i + 1];
        od[i + 2] = src[i + 2];
        od[i + 3] = 255;
      }
    }
    return out;
  }

  /**
   * Blink select: return true if pinned side should show.
   */
  function blinkShowPinned(nowMs, blinkHz, t0) {
    const hz = Number(blinkHz) > 0 ? Number(blinkHz) : 2;
    const phase = ((nowMs - (t0 || 0)) / 1000) * hz;
    return (phase % 1) < 0.5;
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.compareSurface = {
    MODES,
    makePinPacket,
    makeComparisonPacket,
    normalizeMode,
    compositeWipe,
    blinkShowPinned,
    clamp01,
  };
})(window);
