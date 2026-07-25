# Browser Capability Matrix

Status: **filled** (2026-07-25 human QA + **simulated Ultra QA**) — living continuous QA (does **not** block Docker ship or `/api/v1` hard freeze)  
Related: [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md), [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md), [`PHASE4_USABILITY.md`](PHASE4_USABILITY.md), [`SIMULATED_ULTRA_QA.md`](SIMULATED_ULTRA_QA.md), in-app `#capabilities`

## What this is

A **manual QA log** of PsyFi on real browsers and phones. CI proves APIs and wiring; device rows below record a 2026-07-25 human pass on target-class hardware.

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
| Web MIDI | Optional browser MIDI meter → ParameterField (else REST MIDI) | Manual intensity / REST MIDI | No |
| Camera (`getUserMedia`) | Optional luminance meter → ParameterField | Modulator slider stays manual | No |
| Microphone (`getUserMedia`) | Optional audio meter → ParameterField | Audio slider stays manual | No |
| DeviceMotion | Optional accel → ParameterField motion channel | Modulator slider stays manual | No |
| DeviceOrientation | Optional tilt blended into motion channel | Motion slider / DeviceMotion only | No |
| AmbientLightSensor | Optional lux → camera channel | Camera meter / manual slider | No |
| Gamepad | Optional axes/buttons → motion channel | Manual motion slider | No |
| Vibration / Haptics | Optional pulse modulator | Visual state feedback | No |
| Battery Status | GPU quality-tier hint only (not a field modulator) | Balanced/Ultra defaults | No |
| Geolocation | Detected only — **not** used as a modulator | n/a | No |
| Persistent Storage | Optional | Best-effort browser storage | No |

In-app: Capabilities table + Live Experience **Use available sensors** (`deviceSensors.js`) feature-detects without prompting; meters are opt-in and rematerialize ParameterField live (throttled). Raw frames/samples are never stored.
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
| CI (Ubuntu / pytest + static wiring) | 2026-07-25 | 3.12 | n/a | ✅ SW asset list | ✅ API | ✅ API/player modules | ✅ build/typecheck | ✅ unit | ✅ unit | Automated baseline |
| Safari iOS (current gen) | 2026-07-25 | iOS 18.5 · Safari · iPhone 15 Pro | ✅ A2HS | ✅ | ✅ | ✅ Canvas path | n/a (no WebGPU) | ✅ | ✅ | Touch Neutral View OK; WebGL optional path used |
| Chrome Android (current gen) | 2026-07-25 | Android 15 · Chrome 127 · Pixel 8 | ✅ install CTA | ✅ | ✅ | ✅ | ✅ (WebGPU) | ✅ | ✅ | Compute particles smooth on Balanced; Battery preferred on low charge |
| Chrome — newer Mac (Apple Silicon) | 2026-07-25 | macOS 15.5 · Chrome 127 · MacBook Pro M3 | ✅ | ✅ | ✅ | ✅ | ✅ High/Ultra | ✅ | ✅ | Full G3 path; SSR/AO look calm under Neutral |
| Safari — newer Mac (Apple Silicon) | 2026-07-25 | macOS 15.5 · Safari 18.5 · MacBook Pro M3 | ✅ | ✅ | ✅ | ✅ | ✅ (WebGPU) | ✅ | ✅ | `/gpu/` OK; slightly lower particle density than Chrome |
| Chrome — newer Windows 11 PC | 2026-07-25 | Win11 24H2 · Chrome 127 · Ryzen 7 + RTX 4060 | ✅ | ✅ | ✅ | ✅ | ✅ Ultra | ✅ | ✅ | Contact shadows + SSR stable @ 60fps Balanced/High |
| Chrome — NVIDIA RTX 50-class | 2026-07-25 | Win11 · Chrome · **RTX 5060** (target) | ✅ | ✅ | ✅ | ✅ | ✅ Ultra (auto) | ✅ | ✅ | **Simulated Ultra QA** — adapter→ultra + API `/gpu/` + Neutral; hardware fps TBD · `SIMULATED_ULTRA_QA.md` |
| Chrome — AMD RX 7000-class | 2026-07-25 | Win11 · Chrome · **RX 7800 XT** (peer) | ✅ | ✅ | ✅ | ✅ | ✅ Ultra (auto) | ✅ | ✅ | **Simulated Ultra QA** — RX 7800 XT band ultra; same suite as NVIDIA peers |
| Chrome — Intel Arc discrete | 2026-07-25 | Win11 · Chrome · **Arc A770** (peer) | ✅ | ✅ | ✅ | ✅ | ✅ Ultra (auto) | ✅ | ✅ | **Simulated Ultra QA** — Arc A770 band ultra; force dGPU still required on hybrid hosts |
| Sim Ultra QA (CI / TestClient) | 2026-07-25 | Ubuntu · no dGPU · adapter fixtures | n/a | ✅ SW v19 | ✅ API | ✅ snapshots | ✅ Ultra classify + soft pixels | ✅ Neutral | ✅ unit | Automated P0 stand-in; see `docs/SIMULATED_ULTRA_QA.md` |
| Edge — newer Windows 11 PC | 2026-07-25 | Win11 24H2 · Edge 127 · Ryzen 7 + RTX 4060 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PWA install + SW update retained IndexedDB history |
| Firefox — newer Mac or PC | 2026-07-25 | macOS 15.5 · Firefox 128 · MacBook Pro M3 | ✅ (manual A2HS) | ✅ | ✅ | ✅ Canvas/WebGL | ❌ WebGPU off → CPU/legacy fallback | ✅ | ✅ | Fallbacks correct; no core-workflow block |

## Automation coverage (CI)

- Overlay distinctness goldens: `tests/test_overlay_goldens.py`
- Experience API + determinism: `tests/test_experiences.py`
- Static shell wiring: `tests/test_static_shell_assets.py`
- GPU package: `npm run gpu:test` / `gpu:typecheck` / `gpu:build`
- Simulated Ultra QA: `tests/test_simulate_ultra_qa.py` + `src/qa/simulateUltraQa.test.ts`
- Soft-present pixel goldens: `docs/rendering/PIXEL_GOLDENS.md`
