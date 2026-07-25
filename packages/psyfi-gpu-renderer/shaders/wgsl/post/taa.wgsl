// PsyFi G2 — temporal resolve (CPU policy in TemporalAccumulate.ts; runtime uses TSL afterImage).
// Contract: history + current beauty only; no symbolic inference.

struct TaaUniforms {
  current_weight: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
}

@group(0) @binding(0) var current_tex: texture_2d<f32>;
@group(0) @binding(1) var history_tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;
@group(0) @binding(3) var<uniform> u: TaaUniforms;

@fragment
fn main_fs(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let cur = textureSample(current_tex, samp, uv).rgb;
  var hist = textureSample(history_tex, samp, uv).rgb;

  // 3x3 neighborhood clamp (ghosting mitigation)
  let texel = 1.0 / vec2<f32>(textureDimensions(current_tex));
  var nmin = cur;
  var nmax = cur;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let n = textureSample(current_tex, samp, uv + vec2<f32>(f32(x), f32(y)) * texel).rgb;
      nmin = min(nmin, n);
      nmax = max(nmax, n);
    }
  }
  hist = clamp(hist, nmin, nmax);

  let w = clamp(u.current_weight, 0.0, 1.0);
  let out_rgb = cur * w + hist * (1.0 - w);
  return vec4<f32>(out_rgb, 1.0);
}
