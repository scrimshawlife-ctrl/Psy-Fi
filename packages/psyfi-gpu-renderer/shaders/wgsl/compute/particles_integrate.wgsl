struct Particle { pos: vec3<f32>, vel: vec3<f32> }
@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> u_dt: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&particles)) { return; }
  var p = particles[i];
  p.pos = p.pos + p.vel * u_dt;
  particles[i] = p;
}
