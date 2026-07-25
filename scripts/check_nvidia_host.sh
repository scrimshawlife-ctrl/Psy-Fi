#!/usr/bin/env bash
# Host-side NVIDIA readiness check for PsyFi desktop / Compose nvidia profile.
set -euo pipefail

echo "== PsyFi NVIDIA host check =="

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "FAIL: nvidia-smi not found. Install NVIDIA drivers (+ Container Toolkit for Docker)."
  exit 1
fi

nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader || {
  echo "FAIL: nvidia-smi could not query a GPU."
  exit 1
}

if nvidia-smi --query-gpu=name --format=csv,noheader | grep -Eiq 'RTX (20|30|40|50)|GeForce'; then
  echo "OK: discrete NVIDIA GeForce/RTX detected (includes 50-series / 5060 class)."
else
  echo "WARN: GPU present but not matched as GeForce/RTX — WebGPU may still work."
fi

if command -v docker >/dev/null 2>&1; then
  if docker info 2>/dev/null | grep -iq nvidia; then
    echo "OK: Docker reports NVIDIA runtime support."
  else
    echo "WARN: Docker NVIDIA runtime not obvious — install NVIDIA Container Toolkit for --profile nvidia."
  fi
fi

echo
echo "Next:"
echo "  docker compose --profile nvidia up -d --build"
echo "  open http://localhost:8000/gpu/  (Chrome/Edge, High-performance GPU)"
echo "See docs/NVIDIA_GPU.md"
