# Simulated P0 Ultra desktop QA

Status: **passed (simulated)** — 2026-07-25  
Mode: CI / TestClient stand-in for human Ultra validation on discrete GPUs  
Related: [`DESKTOP_GPU.md`](DESKTOP_GPU.md), [`BROWSER_CAPABILITY_MATRIX.md`](BROWSER_CAPABILITY_MATRIX.md), [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md)

## What this is

Physical NVIDIA / AMD / Intel machines are not available in this agent environment. This pass **simulates** the P0 Ultra checklist from the continuation plan using:

| Layer | Coverage |
| --- | --- |
| Adapter → Ultra band / tier | `packages/psyfi-gpu-renderer/src/qa/simulateUltraQa.test.ts` |
| Battery clamp Ultra → Balanced | same |
| Soft-present pixel distinctness | G4 seed fixtures |
| `/health` `/ready` `/gpu/` | `tests/test_simulate_ultra_qa.py` |
| Ultra scene-snapshots + Neutral clamp | same → `tests/fixtures/qa/simulated_ultra_qa.v1.json` |

## Checklist results (simulated)

| # | Check | Result |
| --- | --- | --- |
| 1 | NVIDIA RTX 30/40/50 → band ultra · tier ultra | ✅ simulated |
| 2 | AMD RX 6000/7000/9000 → Ultra | ✅ simulated |
| 3 | Intel Arc discrete → Ultra | ✅ simulated |
| 4 | Apple M Pro/Max → Ultra | ✅ simulated |
| 5 | Mid discrete RTX 20 → High (not Ultra) | ✅ simulated |
| 6 | Battery Saver clamps Ultra → Balanced | ✅ simulated |
| 7 | Ultra enables SSAO/SSR + safety pass | ✅ simulated |
| 8 | `/gpu/` shell mounted (built dist) | ✅ simulated |
| 9 | G4 seeds publish ultra snapshots (distinct hashes) | ✅ simulated |
| 10 | Neutral View collapses SSR/SSAO | ✅ simulated |

## Not claimed

- Real frame times / 1% lows on physical silicon  
- Driver Control Panel “High performance GPU” forcing  
- Chrome `chrome://gpu` WebGPU Hardware accelerated on a specific host  

Re-run on hardware with [`DESKTOP_GPU.md`](DESKTOP_GPU.md) validation checklist when a discrete desktop is available; update the device matrix Notes from `simulated` → measured fps.

## Commands

```bash
npm run gpu:test          # includes simulateUltraQa
python3 -m pytest tests/test_simulate_ultra_qa.py -q
cat tests/fixtures/qa/simulated_ultra_qa.v1.json
```
