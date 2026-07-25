#!/usr/bin/env bash
# Copy Draco (glTF) + Basis transcoder assets from three.js into the GPU package.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THREE_LIBS="$ROOT/node_modules/three/examples/jsm/libs"
OUT_DRACO="$ROOT/packages/psyfi-gpu-renderer/public/vendor/draco/gltf"
OUT_BASIS="$ROOT/packages/psyfi-gpu-renderer/public/vendor/basis"

mkdir -p "$OUT_DRACO" "$OUT_BASIS"
cp "$THREE_LIBS/draco/gltf/draco_decoder.wasm" \
   "$THREE_LIBS/draco/gltf/draco_wasm_wrapper.js" \
   "$THREE_LIBS/draco/gltf/draco_decoder.js" \
   "$OUT_DRACO/"
cp "$THREE_LIBS/basis/basis_transcoder.wasm" \
   "$THREE_LIBS/basis/basis_transcoder.js" \
   "$OUT_BASIS/"
cp "$THREE_LIBS/draco/README.md" "$ROOT/packages/psyfi-gpu-renderer/public/vendor/draco/README.md"
cp "$THREE_LIBS/basis/README.md" "$ROOT/packages/psyfi-gpu-renderer/public/vendor/basis/README.md"
echo "Vendored Draco glTF + Basis transcoder into packages/psyfi-gpu-renderer/public/vendor/"
