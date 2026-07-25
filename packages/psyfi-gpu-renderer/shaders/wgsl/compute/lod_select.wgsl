// PsyFi G2 — LOD select (mirrors TS `selectLod`).

struct LodUniforms {
  near: f32,
  mid: f32,
  far: f32,
  draw_budget: u32,
  camera: vec3<f32>,
  _pad: f32,
}

@group(0) @binding(0) var<storage, read> positions: array<vec3<f32>>;
@group(0) @binding(1) var<storage, read_write> lod_out: array<u32>;
@group(0) @binding(2) var<uniform> u: LodUniforms;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&positions)) { return; }
  if (i >= u.draw_budget) {
    lod_out[i] = 2u;
    return;
  }
  let d = length(positions[i] - u.camera);
  var lod: u32 = 2u;
  if (d < u.near) {
    lod = 0u;
  } else if (d < u.mid) {
    lod = 1u;
  } else if (d < u.far) {
    lod = 2u;
  }
  lod_out[i] = lod;
}
