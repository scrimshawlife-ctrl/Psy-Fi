# Browser Capability Matrix

Status: **unfrozen** — living continuous QA (does **not** block Docker ship or `/api/v1` hard freeze)  
Related: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md), [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md), [`PHASE4_USABILITY.md`](PHASE4_USABILITY.md), in-app `#capabilities`

## What this is

A **manual QA log** of PsyFi on real browsers and phones. CI proves APIs and wiring; it does **not** prove install prompts, Safari quirks, touch Neutral View, or WebGPU on device.

Previously this matrix gated hard freeze. That gate is **lifted** for production readiness — keep filling rows as hardware is available; do not invent results.

## Target devices (what to test on)

| Class | Target hardware | Notes |
|---|---|---|
| Desktop Mac | **Newer Apple Silicon Mac** (M1 or later preferred; M2/M3/M4 ideal), macOS 14+ | Safari + Chrome; WebGPU on Safari/Chrome as available |
| Desktop PC | **Newer Windows 11 PC** (recent Intel/AMD CPU + modern iGPU, or discrete GPU from ~2020+) | Chrome + Edge primary; Firefox secondary |
| Phone | Current-generation Safari iOS and Chrome Android | Install / A2HS + touch Neutral View |

Skip aging machines (pre-2018 Intel Macs, HD 4000–class PCs) for readiness evidence — they are best-effort only.

## Runtime capability expectations

The web shell detects support in the current browser. Optional capabilities never block the core online workflow.

| Capability | Baseline expectation | Fallback when unsupported | Blocks core workflow? |
|---|---|---|---|
| Canvas 2D | Required for Live Experience + heatmap | Metrics + provenance text only | No |
| WebGL | Optional ParameterField path | Canvas 2D engines | No |
| WebGPU | Optional heatmap + `/gpu/` platform + G2 compute particles | Canvas/WebGL legacy shell; CPU particle integrate | No |
| Web Workers | Heatmap rasterize off main thread | Main-thread Canvas | No |
| IndexedDB | Preferred history store | `localStorage` last session | No |
| Service Worker | Installable shell caching | Online-only static hosting | No |
| Web MIDI | Optional modulator / server MIDI | Manual intensity / REST MIDI | No |
| Camera (`getUserMedia`) | Optional luminance meter → ParameterField | Modulator slider stays manual | No |
| Microphone (`getUserMedia`) | Optional audio meter → ParameterField | Audio slider stays manual | No |
| DeviceMotion | Optional tilt → ParameterField | Modulator slider stays manual | No |
| Vibration / Haptics | Optional pulse modulator | Visual state feedback | No |
| Persistent Storage | Optional | Best-effort browser storage | No |
| `beforeinstallprompt` | Optional install CTA | Share → Add to Home Screen | No |

## How to fill a row

1. Deploy or run locally (`docker compose up -d --build` or `python3 scripts/run_dev_server.py`).
2. On the target browser/device, exercise:
   - **Core:** configure → run/cancel job → inspect → export/save  
   - **Live Experience (`/`):** substance → recipe → mode → intensity → play → Neutral View → phase scrub  
   - **GPU (`/gpu/`)** if WebGPU is available: load snapshot, change substance/tier, confirm Neutral / safety still calm; note whether compute particles stay smooth
3. Mark each checklist cell ✅ / ❌ / n/a and add a short Notes cell (exact model, OS/browser versions, fail detail, PR link).
4. Mirror notable results into [`PHASE4_USABILITY.md`](PHASE4_USABILITY.md) evidence log.
5. Failures that change product fallbacks must update this table **and** in-app capability copy.

## Device verification checklist

| Browser / device | Date | Version | Install / A2HS | SW update OK | Jobs cancel | Live Experience | `/gpu/` + compute | Neutral ≤ intent | Reduce motion | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CI (Ubuntu / pytest + static wiring) | 2026-07-25 | 3.12 | n/a | ✅ SW asset list | ✅ API | ✅ API/player modules | ✅ build/typecheck | ✅ unit | ✅ unit | Automated only — continuous QA still welcome on devices |
| Safari iOS (current gen) | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA |
| Chrome Android (current gen) | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA |
| Chrome — newer Mac (Apple Silicon) | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA — record Mac model |
| Safari — newer Mac (Apple Silicon) | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA — record Mac model |
| Chrome — newer Windows 11 PC | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA — record CPU/GPU |
| Edge — newer Windows 11 PC | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA — record CPU/GPU |
| Firefox — newer Mac or PC | | | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | living QA — WebGPU may be limited |

## Automation coverage (CI)

- Overlay distinctness goldens: `tests/test_overlay_goldens.py`
- Experience API + determinism: `tests/test_experiences.py`
- Static shell wiring: `tests/test_static_shell_assets.py`
- GPU package: `npm run gpu:test` / `gpu:typecheck` / `gpu:build`
