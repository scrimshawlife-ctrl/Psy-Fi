/**
 * Optional WebGL ParameterField renderer. Canvas engines remain the fallback.
 * Uniforms are driven exclusively by the immutable parameter field snapshot.
 */
(function (global) {
  'use strict';

  const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

  const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_feedback;
uniform float u_recursion;
uniform float u_symmetry;
uniform float u_turb;
uniform float u_zoom;
uniform float u_disp;
uniform float u_entropy;
uniform float u_bloom;
uniform float u_depth;
uniform float u_complex;
uniform float u_void;
uniform float u_attr;
uniform float u_energy;
uniform float u_wR;
uniform float u_wK;
uniform float u_wF;
uniform float u_wO;
uniform float u_wV;
uniform float u_wE;
uniform float u_neutral;
uniform vec3 u_palette;
uniform float u_seed;

float hash(vec2 p) {
  return fract(sin(dot(p + u_seed * 0.001, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 uv = v_uv * 2.0 - 1.0;
  uv.x *= 1.2;
  if (u_neutral > 0.8) {
    float r = length(uv);
    float v = 0.08 + 0.04 * sin(u_time * 0.5 + r * 3.0);
    gl_FragColor = vec4(vec3(0.04 + v * 0.12), 1.0);
    return;
  }

  // kaleidoscope
  float ang = atan(uv.y, uv.x);
  float rad = length(uv);
  float seg = 3.14159265 / max(2.0, u_symmetry);
  float ka = abs(mod(ang, 2.0 * seg) - seg);
  vec2 kuv = vec2(cos(ka), sin(ka)) * rad;
  uv = mix(uv, kuv, clamp(u_wK, 0.0, 1.0));

  // recursive spin/zoom
  float z = 1.0 + u_zoom * 1.8 * sin(u_time * (0.4 + u_recursion));
  uv *= z;
  float spin = u_time * (0.15 + u_feedback * 0.5);
  float cs = cos(spin); float sn = sin(spin);
  uv = mix(uv, vec2(uv.x * cs - uv.y * sn, uv.x * sn + uv.y * cs), clamp(u_wR, 0.0, 1.0));

  // flow
  vec2 flow = vec2(
    fbm(uv * 2.2 + vec2(u_time * 0.15, 0.0)) - 0.5,
    fbm(uv * 2.2 + vec2(5.2, u_time * 0.12)) - 0.5
  );
  uv += flow * u_disp * 0.9 * u_wF;

  float organic = pow(fbm(uv * 1.4 + vec2(0.0, u_time * 0.08)), 1.2 - u_complex * 0.4);
  float r = length(uv);
  float voidF = exp(-pow((r - (0.15 + u_depth * 0.35 + mod(u_time * 0.03, 0.4))) * 3.5, 2.0)) * (0.4 + u_void);
  float lx = sin(uv.x * (18.0 + u_complex * 40.0) + u_time * (1.0 + u_entropy));
  float ly = cos(uv.y * (18.0 + u_complex * 40.0) - u_time * 0.8);
  float lz = sin((uv.x + uv.y) * (22.0 + u_complex * 30.0) + u_time * 1.3);
  float lattice = pow(abs(lx * ly * lz), 0.35 + (1.0 - u_complex) * 0.4);
  float feedbackF = fbm(uv * (3.0 + u_recursion * 6.0) - vec2(0.0, u_time * u_feedback));

  float v = feedbackF * u_wR + organic * u_wO + voidF * u_wV + lattice * u_wE + fbm(uv * 1.1) * u_wF * 0.5;
  if (u_attr > 0.2) {
    v *= 0.75 + 0.55 * exp(-r * (1.5 + u_attr * 2.0));
    v += u_attr * 0.15 * pow(max(0.0, 1.0 - r * 2.0), 2.0);
  }
  v = clamp(v * (0.7 + u_energy * 0.8), 0.0, 1.0);

  vec3 col = u_palette * v * (0.45 + v);
  col.g += organic * 0.15;
  col.b += lattice * 0.3;
  float bAmt = u_bloom * v * v;
  col = mix(col, vec3(1.0), bAmt * 0.85);
  // soft safety ceiling
  float m = max(col.r, max(col.g, col.b));
  if (m > 0.96) col *= 0.96 / m;
  gl_FragColor = vec4(col, 1.0);
}`;

  class ParameterFieldWebGL {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
      this.ok = !!this.gl;
      this.program = null;
      this.frame = null;
      this.t0 = performance.now();
      this.running = false;
      this.raf = 0;
      if (this.ok) this._init();
    }

    _init() {
      const gl = this.gl;
      const vs = this._shader(gl.VERTEX_SHADER, VERT);
      const fs = this._shader(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) {
        this.ok = false;
        return;
      }
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        this.ok = false;
        return;
      }
      this.program = prog;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.buf = buf;
      this.aPos = gl.getAttribLocation(prog, 'a_pos');
    }

    _shader(type, src) {
      const gl = this.gl;
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[PsyFi WebGL]', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    setFrame(frame) {
      this.frame = frame;
    }

    resize(w, h) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    start() {
      if (!this.ok || this.running) return;
      this.running = true;
      this.t0 = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        this.draw(now);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    draw(now) {
      if (!this.ok || !this.program) return;
      const gl = this.gl;
      const f = this.frame || {};
      const p = f.parameters || {};
      const eng = f.engines || {};
      const pal = (global.PsyFiViz.math && global.PsyFiViz.math.hexToRgb((f.palette && f.palette.tracers) || '#63F3E8')) || {
        r: 99, g: 243, b: 232,
      };
      const time = (now - this.t0) / 1000;
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

      const set = (name, v) => {
        const loc = gl.getUniformLocation(this.program, name);
        if (loc != null) gl.uniform1f(loc, v);
      };
      set('u_time', time);
      set('u_feedback', p.feedback_strength || 0.4);
      set('u_recursion', p.recursion_gain || 0.35);
      set('u_symmetry', Math.max(2, 2 + (p.symmetry_order || 0.3) * 10));
      set('u_turb', p.turbulence || 0.25);
      set('u_zoom', p.zoom_velocity || 0.08);
      set('u_disp', p.displacement || 0.2);
      set('u_entropy', p.entropy || 0.3);
      set('u_bloom', p.bloom || 0.25);
      set('u_depth', p.depth_distortion || 0.35);
      set('u_complex', p.pattern_complexity || 0.4);
      set('u_void', p.void_bias || 0);
      set('u_attr', p.attractor_bias || 0);
      set('u_energy', (f.palette && f.palette.energy) || p.palette_energy || 0.5);
      set('u_wR', eng.recursive_feedback || 0.3);
      set('u_wK', eng.kaleidoscope || 0.2);
      set('u_wF', eng.flow_field || 0.2);
      set('u_wO', eng.organic_bloom || 0.2);
      set('u_wV', eng.void_expansion || 0.15);
      set('u_wE', eng.entity_lattice || 0.1);
      set('u_neutral', f.neutral_view || (eng.neutral_view || 0) > 0.8 ? 1 : 0);
      set('u_seed', (f.master_seed || 42) % 1000);
      const pl = gl.getUniformLocation(this.program, 'u_palette');
      if (pl) gl.uniform3f(pl, pal.r / 255, pal.g / 255, pal.b / 255);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    static supported() {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
      } catch (_e) {
        return false;
      }
    }
  }

  global.PsyFiViz = global.PsyFiViz || {};
  global.PsyFiViz.ParameterFieldWebGL = ParameterFieldWebGL;
})(window);
