#!/usr/bin/env node
/**
 * Numeric invariant smoke tests for Live Experience viz helpers.
 * Run: node tests/js/run_viz_helper_tests.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function loadIife(rel) {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  const sandbox = {
    window: {},
    performance: { now: () => 1000 },
    console,
  };
  sandbox.window = sandbox;
  // ImageData polyfill for crossfade
  sandbox.ImageData = class ImageData {
    constructor(w, h) {
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
  };
  vm.runInNewContext(code, sandbox, { filename: rel });
  return sandbox.window.PsyFiViz;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function approx(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

const viz = {};
Object.assign(viz, loadIife('psyfi_api/static/viz/instrumentMap.js') || {});
Object.assign(viz, loadIife('psyfi_api/static/viz/compareSurface.js') || {});
Object.assign(viz, loadIife('psyfi_api/static/viz/transitionSurface.js') || {});

const im = viz.instrumentMap;
const cs = viz.compareSurface;
const ts = viz.transitionSurface;
assert(im && cs && ts, 'helpers failed to load');

// instrumentMap
assert(approx(im.intensityFromUi(0), 0), 'intensityFromUi(0)');
assert(approx(im.intensityFromUi(1), 1), 'intensityFromUi(1)');
assert(approx(im.uiFromIntensity(0), 0), 'uiFromIntensity(0)');
assert(approx(im.uiFromIntensity(1), 1), 'uiFromIntensity(1)');
const mid = im.intensityFromUi(0.5);
assert(mid > 0.3 && mid < 0.7, 'mid intensity curved');
const q = im.quantizeIntensity(0.37, 21);
assert(q >= 0 && q <= 1, 'quantize in range');
assert(im.nextMapMode('instrument') === 'stations', 'nextMapMode instrument→stations');
assert(im.nextMapMode('stations') === 'linear', 'nextMapMode stations→linear');
assert(im.nextMapMode('linear') === 'instrument', 'nextMapMode linear→instrument');

// compareSurface wipe / split
const w = 8;
const h = 4;
const pinned = new (globalThis.ImageData || class {
  constructor(ww, hh) {
    this.width = ww;
    this.height = hh;
    this.data = new Uint8ClampedArray(ww * hh * 4);
  }
})(w, h);
const live = new pinned.constructor(w, h);
for (let i = 0; i < pinned.data.length; i += 4) {
  pinned.data[i] = 255;
  pinned.data[i + 1] = 0;
  pinned.data[i + 2] = 0;
  pinned.data[i + 3] = 255;
  live.data[i] = 0;
  live.data[i + 1] = 0;
  live.data[i + 2] = 255;
  live.data[i + 3] = 255;
}
// Use compareSurface with ImageData from its own realm — recreate via helper by
// attaching ImageData to the compare load sandbox. Re-load compare with shared ImageData.
function loadWithImageData(rel) {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  class ImageData {
    constructor(ww, hh) {
      this.width = ww;
      this.height = hh;
      this.data = new Uint8ClampedArray(ww * hh * 4);
    }
  }
  const sandbox = { window: {}, console, ImageData, performance: { now: () => 0 } };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: rel });
  return { viz: sandbox.window.PsyFiViz, ImageData };
}
const cmp = loadWithImageData('psyfi_api/static/viz/compareSurface.js');
const cs2 = cmp.viz.compareSurface;
const pin2 = new cmp.ImageData(w, h);
const live2 = new cmp.ImageData(w, h);
for (let i = 0; i < pin2.data.length; i += 4) {
  pin2.data[i] = 255; pin2.data[i + 1] = 0; pin2.data[i + 2] = 0; pin2.data[i + 3] = 255;
  live2.data[i] = 0; live2.data[i + 1] = 0; live2.data[i + 2] = 255; live2.data[i + 3] = 255;
}
const wiped = cs2.compositeWipe(pin2, live2, 0.5, w, h);
assert(wiped.data[0] === 255 && wiped.data[2] === 0, 'wipe left is pinned red');
const rightIdx = (0 * w + (w - 1)) * 4;
assert(wiped.data[rightIdx + 2] === 255, 'wipe right is live blue');
const split = cs2.compositeSplit(pin2, live2, w, h);
assert(split.data[0] === 255, 'split left samples pinned');
assert(split.data[rightIdx + 2] === 255, 'split right samples live');
assert(cs2.normalizeMode('WIPE') === 'wipe', 'normalizeMode');
assert(cs2.blinkShowPinned(0, 2, 0) === true, 'blink phase start pinned');

// transitionSurface
assert(ts.durationFor('phase', true) === 0, 'reduce-motion zero duration');
assert(ts.durationFor('journey', false) === 450, 'journey duration');
assert(ts.durationFor('load', false) === 450, 'load duration');
assert(approx(ts.ease(0), 0) && approx(ts.ease(1), 1), 'ease endpoints');
assert(ts.progress(1000, 1000, 0) === 1, 'zero duration progress=1');
assert(ts.isActive(1100, 1000, 320) === true, 'isActive mid');
assert(ts.isActive(1400, 1000, 320) === false, 'isActive done');
const st = ts.makeTransitionState({ hash: 'a' }, 'phase', 1000, false);
assert(st.active === true && st.kind === 'phase', 'makeTransitionState active');
const stOff = ts.makeTransitionState({ hash: 'a' }, 'phase', 1000, true);
assert(stOff.active === false, 'makeTransitionState reduce-motion off');

const xf = loadWithImageData('psyfi_api/static/viz/transitionSurface.js');
const from = new xf.ImageData(2, 2);
const to = new xf.ImageData(2, 2);
for (let i = 0; i < from.data.length; i += 4) {
  from.data[i] = 0; from.data[i + 1] = 0; from.data[i + 2] = 0; from.data[i + 3] = 255;
  to.data[i] = 255; to.data[i + 1] = 255; to.data[i + 2] = 255; to.data[i + 3] = 255;
}
const blended = xf.viz.transitionSurface.compositeCrossfade(from, to, 0.5, 2, 2);
assert(blended.data[0] >= 120 && blended.data[0] <= 135, 'crossfade mid gray');

console.log('viz helper tests: ok');
