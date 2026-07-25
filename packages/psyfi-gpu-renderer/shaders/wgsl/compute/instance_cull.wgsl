// PsyFi G2 — distance cull (mirrors TS `cullInstances` without frustum planes).

struct Sphere {
  center: vec3<f32>,
  radius: f32,
}

struct CullUniforms {
  camera: vec3<f32>,
  max_distance: f32,
}

@group(0) @binding(0) var<storage, read> spheres: array<Sphere>;
@group(0) @binding(1) var<storage, read_write> visible: array<u32>;
@group(0) @binding(2) var<storage, read_write> visible_count: atomic<u32>;
@group(0) @binding(3) var<uniform> u: CullUniforms;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&spheres)) { return; }
  let s = spheres[i];
  let d = s.center - u.camera;
  let d2 = dot(d, d);
  let max_d = u.max_distance;
  if (d2 > max_d * max_d) { return; }
  let slot = atomicAdd(&visible_count, 1u);
  if (slot < arrayLength(&visible)) {
    visible[slot] = i;
  }
}
