# Vendored GPU codecs

| Path | Upstream | License |
| --- | --- | --- |
| `draco/gltf/*` | [google/draco](https://github.com/google/draco) via `three/examples/jsm/libs/draco/gltf` | Apache-2.0 |
| `basis/*` | [BinomialLLC/basis_universal](https://github.com/BinomialLLC/basis_universal) via `three/examples/jsm/libs/basis` | Apache-2.0 |

Refresh with `./scripts/vendor_gpu_codecs.sh` after upgrading `three`.

Runtime URLs (Vite `base: '/gpu/'`):

- `/gpu/vendor/draco/gltf/`
- `/gpu/vendor/basis/`

Node / vitest decode uses the `draco3d` npm package (same Draco decoder family). Browser loads may use the packaged WASM under `/gpu/vendor/`.
