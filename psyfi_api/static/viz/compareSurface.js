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
   * Side-by-side dual viewport: left half = full pinned field, right half = full live field.
   * Each side samples its source scaled to half width (synchronized phase when both from timeline).
   */
  function compositeSplit(pinnedData, liveData, width, height) {
    const out = new ImageData(width, height);
    const pd = pinnedData.data;
    const ld = liveData.data;
    const od = out.data;
    const half = Math.floor(width / 2);
    const rightW = width - half;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        let sx;
        let src;
        if (x < half) {
          src = pd;
          sx = half <= 1 ? 0 : Math.min(width - 1, Math.floor((x / half) * width));
        } else {
          src = ld;
          const lx = x - half;
          sx = rightW <= 1 ? 0 : Math.min(width - 1, Math.floor((lx / rightW) * width));
        }
        const si = (y * width + sx) * 4;
        od[i] = src[si];
        od[i + 1] = src[si + 1];
        od[i + 2] = src[si + 2];
        od[i + 3] = 255;
      }
    }
    // Thin divider for readability (presentation only).
    const mid = half;
    if (mid > 0 && mid < width) {
      for (let y = 0; y < height; y++) {
        const i = (y * width + mid) * 4;
        od[i] = Math.min(255, od[i] + 40);
        od[i + 1] = Math.min(255, od[i + 1] + 40);
        od[i + 2] = Math.min(255, od[i + 2] + 40);
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

  /**
   * Archive record for IndexedDB (INFERRED comparison provenance).
   * Stores ParameterField snapshots for both sides — presentation/history only.
   */
  function makeArchiveRecord(pinned, liveFrame, liveIdx, mode, wipePosition, blinkHz, meta) {
    if (!pinned || !pinned.frame) return null;
    const live = liveFrame || null;
    const m = meta || {};
    const id =
      'cmp-' +
      String(pinned.hash || 'pin').slice(0, 10) +
      '-' +
      String((live && live.hash) || 'live').slice(0, 10) +
      '-' +
      Date.now().toString(36);
    return {
      schema: 'psyfi.comparison.v1',
      claim: 'INFERRED',
      id,
      updated_at: new Date().toISOString(),
      mode: normalizeMode(mode),
      wipe_position: clamp01(wipePosition),
      blink_hz: Number(blinkHz) > 0 ? Number(blinkHz) : 2,
      pinned: {
        frame: pinned.frame,
        idx: pinned.idx | 0,
        hash: pinned.hash || null,
        timeline_hash: pinned.timeline_hash || null,
        at: pinned.at || null,
      },
      live: live
        ? {
            frame: JSON.parse(JSON.stringify(live)),
            idx: liveIdx | 0,
            hash: live.hash || null,
          }
        : null,
      substance: m.substance || (live && live.substance) || (pinned.frame && pinned.frame.substance) || null,
      experience_id: m.experience_id || null,
      seed: m.seed != null ? m.seed : null,
    };
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.compareSurface = {
    MODES,
    makePinPacket,
    makeComparisonPacket,
    makeArchiveRecord,
    normalizeMode,
    compositeWipe,
    compositeSplit,
    blinkShowPinned,
    clamp01,
  };
})(window);
