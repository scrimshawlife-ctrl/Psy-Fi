// PsyFi G2 — particle integrate + soft wrap (pairs with flow_advect).

struct Particle {
  pos: vec3<f32>,
  _pad0: f32,
  vel: vec3<f32>,
  _pad1: f32,
}

struct IntegrateUniforms {
  dt: f32,
  damp: f32,
  limit: f32,
  _pad: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> u: IntegrateUniforms;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&particles)) { return; }
  var p = particles[i];
  p.pos = p.pos + p.vel * u.dt;
  p.vel = p.vel * u.damp;
  let lim = u.limit;
  if (p.pos.x > lim) { p.pos.x -= lim * 2.0; }
  if (p.pos.x < -lim) { p.pos.x += lim * 2.0; }
  if (p.pos.z > lim) { p.pos.z -= lim * 2.0; }
  if (p.pos.z < -lim) { p.pos.z += lim * 2.0; }
  p.pos.y = clamp(p.pos.y, -lim, lim);
  particles[i] = p;
}
