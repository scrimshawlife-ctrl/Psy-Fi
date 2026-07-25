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
uniform float u_chroma;
uniform float u_edge;
uniform float u_trail;
uniform float u_wR;
uniform float u_wK;
uniform float u_wF;
uniform float u_wO;
uniform float u_wV;
uniform float u_wE;
uniform float u_neutral;
uniform float u_safetyAtten;
uniform vec3 u_palette;
uniform float u_seed;
uniform sampler2D u_source;
uniform float u_sourceMix;

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
  for (int i = 0; i < 6; i++) {
    s += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

float tanh1(float x) {
  float e = exp(clamp(2.0 * x, -12.0, 12.0));
  return (e - 1.0) / (e + 1.0);
}

vec2 tanh2(vec2 v) {
  return vec2(tanh1(v.x), tanh1(v.y));
}

vec2 kaleido(vec2 uv, float symmetry, float w) {
  float ang = atan(uv.y, uv.x);
  float rad = length(uv);
  float seg = 3.14159265 / max(2.0, symmetry);
  float ka = abs(mod(ang, 2.0 * seg) - seg);
  vec2 kuv = vec2(cos(ka), sin(ka)) * rad;
  return mix(uv, kuv, clamp(w, 0.0, 1.0));
}

vec2 fractalFold(vec2 p) {
  float scale = 1.35 + u_recursion * 0.85;
  vec2 c = vec2(
    sin(u_time * 0.11 + u_seed * 0.001) * (0.28 + u_feedback * 0.45),
    cos(u_time * 0.09) * (0.22 + u_depth * 0.4)
  );
  float spin = u_time * (0.08 + u_feedback * 0.25);
  float cs = cos(spin);
  float sn = sin(spin);
  vec2 z = p;
  for (int i = 0; i < 6; i++) {
    if (float(i) >= 3.0 + u_recursion * 5.0) break;
    z = abs(z);
    if (z.x > 1.0) z.x = 2.0 - z.x;
    if (z.y > 1.0) z.y = 2.0 - z.y;
    vec2 r = vec2(z.x * cs - z.y * sn, z.x * sn + z.y * cs) * scale + c;
    float r2 = dot(r, r);
    if (r2 < 0.5) r *= 2.0;
    else if (r2 < 1.0) r *= 1.0 / max(r2, 0.0001);
    z = r;
  }
  float warp = 0.12 + u_recursion * 0.18;
  return mix(p, tanh2(z * 0.35), warp);
}

// Returns vec3(v, organic, lattice)
vec3 fieldAt(vec2 uv) {
  uv = kaleido(uv, u_symmetry, u_wK);

  float z = 1.0 + u_zoom * 1.8 * sin(u_time * (0.4 + u_recursion));
  uv *= z;
  float spin = u_time * (0.15 + u_feedback * 0.5);
  float cs = cos(spin); float sn = sin(spin);
  uv = mix(uv, vec2(uv.x * cs - uv.y * sn, uv.x * sn + uv.y * cs), clamp(u_wR, 0.0, 1.0));

  float foldAmt = clamp(u_wR * (0.35 + u_recursion * 0.85 + u_feedback * 0.4), 0.0, 1.0);
  vec2 folded = fractalFold(uv);
  uv = mix(uv, folded, foldAmt);

  vec2 flow = vec2(
    fbm(uv * 2.2 + vec2(u_time * 0.15, 0.0)) - 0.5,
    fbm(uv * 2.2 + vec2(5.2, u_time * 0.12)) - 0.5
  );
  uv += flow * u_disp * (0.9 + u_trail * 0.55) * u_wF;
  uv += flow * u_trail * 0.22 * u_wR;

  float organic = pow(fbm(uv * 1.4 + vec2(0.0, u_time * 0.08)), 1.2 - u_complex * 0.4);
  float vein = fbm(uv * 4.2 - vec2(0.0, u_time * 0.05));
  organic = organic * 0.72 + vein * 0.28;

  float r = length(uv);
  float voidF = exp(-pow((r - (0.15 + u_depth * 0.35 + mod(u_time * 0.03, 0.4))) * 3.5, 2.0)) * (0.4 + u_void);

  float lx = sin(uv.x * (18.0 + u_complex * 40.0) + u_time * (1.0 + u_entropy));
  float ly = cos(uv.y * (18.0 + u_complex * 40.0) - u_time * 0.8);
  float lz = sin((uv.x + uv.y) * (22.0 + u_complex * 30.0) + u_time * 1.3);
  float base = pow(abs(lx * ly * lz), 0.35 + (1.0 - u_complex) * 0.4);
  float scale = 7.0 + u_complex * 26.0;
  vec2 h = vec2(uv.x * scale, uv.y * scale * 1.1547005);
  vec2 g = h - floor(h + 0.5);
  float hex = exp(-length(g) * (3.2 + u_edge * 5.0));
  float ang = atan(uv.y, uv.x);
  float petals = 0.5 + 0.5 * cos(ang * (3.0 + floor(u_complex * 9.0)) + u_time * 1.1);
  float rings = pow(abs(sin(r * (10.0 + u_complex * 18.0) - u_time)), 2.2);
  float lattice = clamp(base * 0.5 + hex * 0.32 + petals * base * 0.22 + rings * 0.12 * u_wE, 0.0, 1.0);

  float orbit = exp(-abs(length(folded) - (0.55 + u_depth * 0.35)) * (3.2 + u_complex * 5.0));
  float feedbackF = fbm(uv * (3.0 + u_recursion * 6.0) - vec2(0.0, u_time * u_feedback));
  feedbackF = feedbackF * (0.55 + u_recursion * 0.2) + orbit * (0.35 + u_feedback * 0.35)
    + fbm(uv * 7.5 + vec2(u_time * 0.2, 0.0)) * u_recursion * 0.25;

  float v = feedbackF * u_wR + organic * u_wO + voidF * u_wV + lattice * u_wE + fbm(uv * 1.1) * u_wF * 0.5;
  if (u_attr > 0.2) {
    v *= 0.75 + 0.55 * exp(-r * (1.5 + u_attr * 2.0));
    v += u_attr * 0.15 * pow(max(0.0, 1.0 - r * 2.0), 2.0);
  }

  float sharpened = smoothstep(0.22, 0.78, v);
  v = mix(v, sharpened, clamp(u_edge * 0.75, 0.0, 0.85));
  v += u_edge * 0.12 * abs(lattice - organic);
  v = clamp(v * (0.7 + u_energy * 0.8), 0.0, 1.0);
  return vec3(v, organic, lattice);
}

void main() {
  vec2 uv = v_uv * 2.0 - 1.0;
  uv.x *= 1.2;
  if (u_neutral > 0.8) {
    float r = length(uv);
    float v = 0.08 + 0.04 * sin(u_time * 0.5 + r * 3.0);
    vec3 ncol = vec3(0.04 + v * 0.12);
    ncol = mix(vec3(0.047, 0.047, 0.055), ncol, clamp(u_safetyAtten, 0.0, 1.0));
    gl_FragColor = vec4(ncol, 1.0);
    return;
  }

  vec3 f0 = fieldAt(uv);
  float v = f0.x;
  float organic = f0.y;
  float lattice = f0.z;
  float chroma = clamp(u_chroma, 0.0, 1.0);
  float vR = v;
  float vB = v;
  if (chroma > 0.02) {
    vec2 dir = normalize(uv + vec2(0.001));
    float off = chroma * 0.045;
    vR = fieldAt(uv + dir * off).x;
    vB = fieldAt(uv - dir * off).x;
  }

  if (u_sourceMix > 0.001) {
    float src = texture2D(u_source, v_uv).r;
    float sm = clamp(u_sourceMix, 0.0, 1.0) * 0.85;
    v = mix(v, src, sm);
    vR = mix(vR, src, sm);
    vB = mix(vB, src, sm);
  }

  vec3 col;
  col.r = u_palette.r * vR * (0.45 + vR);
  col.g = u_palette.g * v * (0.5 + v * 0.35) + organic * 0.14 * u_wO;
  col.b = u_palette.b * vB * (0.48 + vB * 0.55) + lattice * 0.28 * u_wE;

  col.g += (v * 0.12 + organic * 0.08) * (0.6 + u_energy * 0.4);
  col.r += chroma * 0.08 * abs(vR - vB);

  float bAmt = u_bloom * v * v;
  col = mix(col, vec3(1.0), bAmt * 0.72);
  col += vec3(0.02, 0.06, 0.08) * bAmt;

  float vig = smoothstep(1.35, 0.35, length(uv));
  col *= 0.72 + 0.28 * vig;

  float peak = max(col.r, max(col.g, col.b));
  if (peak > 0.96) col *= 0.96 / peak;
  col = mix(vec3(0.047, 0.047, 0.055), col, clamp(u_safetyAtten, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

  class ParameterFieldWebGL {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', { alpha: false, antialias: true, preserveDrawingBuffer: true });
      this.ok = !!this.gl;
      this.program = null;
      this.frame = null;
      this.sourcePlane = null;
      this.sourceTex = null;
      this.t0 = performance.now();
      this.running = false;
      this.raf = 0;
      this.safety =
        global.PsyFiViz && global.PsyFiViz.SafetyPass
          ? new global.PsyFiViz.SafetyPass()
          : null;
      this._safetyAtten = 1.0;
      this._sampleBuf = null;
      if (this.ok) this._init();
    }

    setSourcePlane(plane) {
      this.sourcePlane = plane && plane.mix > 0 ? plane : null;
      if (!this.ok || !this.gl) return;
      const gl = this.gl;
      if (!this.sourcePlane) {
        this._sourceMix = 0;
        return;
      }
      if (!this.sourceTex) this.sourceTex = gl.createTexture();
      const { width, height, data, mix } = this.sourcePlane;
      const rgba = new Uint8Array(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        const v = Math.max(0, Math.min(255, Math.round(data[i] * 255)));
        const o = i * 4;
        rgba[o] = v;
        rgba[o + 1] = v;
        rgba[o + 2] = v;
        rgba[o + 3] = 255;
      }
      gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      this._sourceMix = mix;
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

    resize(w, h, opts) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bufferW = opts && opts.bufferW ? Math.floor(opts.bufferW) : Math.floor(w * dpr);
      const bufferH = opts && opts.bufferH ? Math.floor(opts.bufferH) : Math.floor(h * dpr);
      this.canvas.width = Math.max(16, bufferW);
      this.canvas.height = Math.max(16, bufferH);
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
      const pal = (global.PsyFiViz.math && global.PsyFiViz.math.hexToRgb((f.palette && f.palette.tracers) || '#3ee7f2')) || {
        r: 62, g: 231, b: 242,
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
      set('u_chroma', p.chromatic_aberration || 0.1);
      set('u_edge', p.edge_gain || 0.4);
      set('u_trail', p.trail_length || 0.35);
      set('u_wR', eng.recursive_feedback || 0.3);
      set('u_wK', eng.kaleidoscope || 0.2);
      set('u_wF', eng.flow_field || 0.2);
      set('u_wO', eng.organic_bloom || 0.2);
      set('u_wV', eng.void_expansion || 0.15);
      set('u_wE', eng.entity_lattice || 0.1);
      set('u_neutral', f.neutral_view || (eng.neutral_view || 0) > 0.8 ? 1 : 0);
      // Measure from an unattenuated present, then re-draw if SafetyPass pulls down.
      set('u_safetyAtten', 1.0);
      set('u_seed', (f.master_seed || 42) % 1000);
      const pl = gl.getUniformLocation(this.program, 'u_palette');
      if (pl) gl.uniform3f(pl, pal.r / 255, pal.g / 255, pal.b / 255);

      const mix = this.sourcePlane ? this.sourcePlane.mix || this._sourceMix || 0 : 0;
      set('u_sourceMix', mix);
      const srcLoc = gl.getUniformLocation(this.program, 'u_source');
      if (srcLoc != null) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sourceTex || this._fallbackTex());
        gl.uniform1i(srcLoc, 0);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this._updateSafetyAtten(f, now);
      if (this._safetyAtten < 0.999) {
        set('u_safetyAtten', this._safetyAtten);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    _updateSafetyAtten(frame, now) {
      if (!this.safety || !this.gl || !this.ok) return;
      const gl = this.gl;
      const sw = Math.min(48, this.canvas.width | 0);
      const sh = Math.min(48, this.canvas.height | 0);
      if (sw < 2 || sh < 2) return;
      const x = Math.max(0, ((this.canvas.width - sw) / 2) | 0);
      const y = Math.max(0, ((this.canvas.height - sh) / 2) | 0);
      const need = sw * sh * 4;
      if (!this._sampleBuf || this._sampleBuf.length !== need) {
        this._sampleBuf = new Uint8Array(need);
      }
      try {
        gl.readPixels(x, y, sw, sh, gl.RGBA, gl.UNSIGNED_BYTE, this._sampleBuf);
      } catch (_e) {
        return;
      }
      this._safetyAtten = this.safety.measureAtten(
        this._sampleBuf,
        (frame && frame.safety) || {},
        now,
        16
      );
    }

    _fallbackTex() {
      if (this._blackTex) return this._blackTex;
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      this._blackTex = t;
      return t;
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
