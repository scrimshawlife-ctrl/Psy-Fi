# Desktop GPU Integration (WebGPU)

Status: supported for **browser WebGPU** on high-end discrete desktops  
Related: [`NVIDIA_GPU.md`](NVIDIA_GPU.md) (NVIDIA drivers + Compose profile), [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md), [`rendering/GPU_PERFORMANCE_BUDGET.md`](rendering/GPU_PERFORMANCE_BUDGET.md), `/gpu/`

## How PsyFi uses your GPU

| Layer | Uses vendor CUDA/HIP/oneAPI? | Uses your GPU? |
| --- | --- | --- |
| Python ABX-Core / FastAPI | No | No (CPU) |
| Legacy Live Experience (`/`) | No | Optional via WebGL |
| GPU platform (`/gpu/`) | No | **Yes — WebGPU** (Chrome/Edge → D3D12/Vulkan/Metal) |

PsyFi does **not** require CUDA, ROCm, or oneAPI for the web product. Discrete GPUs accelerate the `/gpu/` present path inside the browser.

## Supported high-end bands → Ultra (auto)

| Vendor | Series (examples) | Default recommended tier |
| --- | --- | --- |
| **NVIDIA** | GeForce **RTX 30 / 40 / 50** (3060…5090, incl. **5060**) | **Ultra** |
| **AMD** | Radeon **RX 6000 / 7000 / 9000** (6800, 7800 XT, 9070 XT, …) | **Ultra** |
| **Intel** | **Arc** discrete (A750/A770, B580, …) | **Ultra** |
| **Apple** | M-series **Pro / Max / Ultra** | **Ultra** |
| Mid discrete | RTX 20, GTX 16, RX 5000, other dGPU | **High** |
| iGPU / unknown | Intel UHD/Iris, etc. | **Balanced** |
| No WebGPU | — | Legacy `/` shell |

You can still override the tier dropdown manually. Battery Saver / low charge clamps Ultra → Balanced.

## Host setup (any vendor)

1. Install current GPU drivers (Game Ready / Adrenalin / Arc / Apple OS updates).
2. Use **Chrome** or **Edge** (recent stable). Check `chrome://gpu` → WebGPU Hardware accelerated.
3. Prefer the **discrete** GPU for the browser:
   - Windows: Settings → System → Display → Graphics → Chrome/Edge → **High performance**
   - Or vendor control panel (NVIDIA / AMD) → High-performance GPU for Chrome/Edge
4. Run PsyFi and open **`/gpu/`**:
   ```bash
   docker compose up -d --build
   # or: python3 scripts/run_dev_server.py
   ```
5. Confirm the HUD shows your adapter string and tier **ultra** on supported high-end cards.

## NVIDIA-only extras

Docker GPU reservation (`--profile nvidia`), `nvidia-smi`, and RTX 50xx driver notes live in [`NVIDIA_GPU.md`](NVIDIA_GPU.md). The API container still does **not** run CUDA kernels; WebGPU runs in the browser.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| HUD says no WebGPU | Update Chrome/Edge; check `chrome://gpu`; update GPU driver |
| Runs on iGPU | Force High-performance GPU for the browser |
| Tier stuck on Balanced | Confirm adapter string matches a Ultra-band series; disable Battery Saver |
| AMD/Intel not Ultra | Confirm description includes RX 6/7/9xxx or Arc A/B series |

## Validation checklist (next human step)

After deploy, on each target GPU:

1. Open Chrome/Edge → `http://localhost:8000/gpu/` (or your host URL).
2. HUD shows **adapter** string, **vendor**, **band ultra**, and tier **ultra**.
3. Profiling line shows FPS · avg/p95/max ms vs tier **target** (prefer **ok**, not OVER).
4. Toggle Neutral View — safety pass still attenuates; scene stays calm.
5. With Battery Saver / low charge, tier clamps away from Ultra.
6. Optional: note p95 vs [`GPU_PERFORMANCE_BUDGET.md`](rendering/GPU_PERFORMANCE_BUDGET.md) Ultra targets.

Update [`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md) if results differ from the peer rows.

## Recommended engineering follow-ups

See [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md) — after hardware validation: G4 cutover parity/goldens ([`rendering/G4_CUTOVER.md`](rendering/G4_CUTOVER.md)). Profiling HUD and KTX2/Draco upload bridges are in `/gpu/`.

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
