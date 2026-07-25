// Mandatory luminance / flash attenuator — final composite must include this pass.
struct SafetyUniforms {
  max_luminance_delta: f32,
  max_flash_hz: f32,
  atten: f32,
}
@group(0) @binding(0) var<uniform> u_safety: SafetyUniforms;
@group(0) @binding(1) var s_color: texture_2d<f32>;
@group(0) @binding(2) var s_sampler: sampler;

@fragment
fn main_fs(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  var c = textureSample(s_color, s_sampler, uv).rgb;
  let m = max(c.r, max(c.g, c.b));
  if (m > 0.96) { c = c * (0.96 / m); }
  c = c * u_safety.atten + vec3<f32>(0.05, 0.05, 0.055) * (1.0 - u_safety.atten);
  return vec4<f32>(c, 1.0);
}
