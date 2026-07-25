// PsyFi G2 — flow advection (mirrors TS `sampleFlow` / `advectPoint`).
// Contract: ParameterField scalars only; no symbolic inference.

struct FlowUniforms {
  turbulence: f32,
  intensity: f32,
  peripheral_flow: f32,
  time: f32,
  dt: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
}

struct Particle {
  pos: vec3<f32>,
  _pad0: f32,
  vel: vec3<f32>,
  _pad1: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> u: FlowUniforms;

fn sample_flow(p: vec3<f32>) -> vec3<f32> {
  let amp = 0.35 + u.intensity * 0.9 + u.turbulence * 0.55;
  let swirl = 0.2 + u.peripheral_flow * 0.8;
  let t = u.time;
  let fx = sin(p.y * 1.7 + t * 0.9) * amp * 0.55 + cos(p.z * 1.3 - t * 0.4) * swirl * 0.35;
  let fy = cos(p.x * 1.4 - t * 0.7) * amp * 0.35 + sin(p.z * 1.1 + t * 0.55) * swirl * 0.25;
  let fz = sin(p.x * 1.2 + p.y * 0.9 + t * 0.65) * amp * 0.55 - cos(p.y * 1.5 - t * 0.5) * swirl * 0.3;
  return vec3<f32>(fx, fy, fz);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&particles)) { return; }
  var particle = particles[i];
  let flow = sample_flow(particle.pos);
  particle.vel = flow;
  particle.pos = particle.pos + flow * u.dt;
  particles[i] = particle;
}
