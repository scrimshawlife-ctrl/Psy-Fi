/**
 * Non-bypassable visual safety pass (flash/luminance clamp).
 */
(function (global) {
  'use strict';

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
        sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      }
      const samples = Math.floor(d.length / 16);
      const luma = sum / (255 * Math.max(1, samples));
      const delta = Math.abs(luma - this.lastLuma);
      if (delta > maxDelta * 0.85) {
        this.flashEvents.push(now);
      }
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

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.SafetyPass = SafetyPass;
})(window);
