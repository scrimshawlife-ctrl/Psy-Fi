<div align="center">

<img src="docs/images/psyfi-hero.jpg" alt="PsyFi consciousness field visualization hero" width="100%" />

# PsyFi

**Consciousness-field simulation workspace and phenomenology visualization instrument.**

Web-first · deterministic ABX-Core · research/visualization only — not medical advice.

[![CI](https://img.shields.io/github/actions/workflow/status/scrimshawlife-ctrl/Psy-Fi/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/scrimshawlife-ctrl/Psy-Fi/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/downloads/)
[![ABX-Core](https://img.shields.io/badge/ABX--Core-v1.3-3EE7F2)](psyfi_core/abx_core)
[![API](https://img.shields.io/badge/api-/api/v1-FF42C1)](docs/contracts/frozen/API_V1_FREEZE.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-informational)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-8F7BFF)](MOBILE_PWA_GUIDE.md)

[Quick start](#quick-start) · [Live Experience](#live-experience) · [Docs](#documentation) · [API](#api) · [Contributing](#contributing)

</div>

---

## What it is

PsyFi is a **deterministic consciousness-field simulator** with a browser workspace:

- Python / FastAPI authority for simulation truth
- Substance presets + phenomenology catalog derived from curated positive reports
- Distilled **substance visual overlays** driving an immutable ParameterField
- Canvas Live Experience engines (optional WebGL path) with a non-bypassable safety pass
- Installable PWA shell, cancelable jobs, IndexedDB history

> The field is expressive. The instrument is precise.

## Quick start

```bash
git clone https://github.com/scrimshawlife-ctrl/Psy-Fi.git
cd Psy-Fi
pip install -e ".[dev]"

# Rebuild experience catalog + substance visual overlays
python3 scripts/build_experience_catalog.py

# Run tests
python3 -m pytest tests/ -q

# Dev server
python3 scripts/run_dev_server.py
# → http://localhost:8000
```

## Live Experience

1. Open **Live Experience**
2. Choose substance + recipe + mode (`Open` / `Attractor` / `Void` / `Power`)
3. Set intensity / seed; scrub the phase timeline
4. Use **Neutral View** (`N`) anytime
5. Optional: camera/motion/MIDI modulators (ParameterField only), export timeline/viewport, bridge from a bounded simulation

```bash
curl -s 'http://localhost:8000/api/v1/substances' | python3 -m json.tool | head
curl -s -X POST http://localhost:8000/api/v1/visualize/parameter-timeline \
  -H 'Content-Type: application/json' \
  -d '{"substance":"dmt","mode":"power","intensity":0.8,"seed":1337,"steps":8}'
```

## Features

| Area | Status |
|---|---|
| ABX-Core deterministic runtime | ✅ |
| Modular field engines | ✅ |
| 22+ substance presets | ✅ |
| Phenomenology catalog + overlays | ✅ |
| Live Experience (Canvas + optional WebGL) | ✅ |
| Cancelable `/api/v1/jobs` | ✅ |
| PWA shell + IndexedDB history | ✅ |
| MIDI (optional) | ✅ |
| Camera / motion modulators | ✅ optional, gated |
| Native iOS | ⏸ separate deferred track |

## Architecture (web)

```text
seed + substance/experience + optional modulators
        ↓
immutable PsyFiParameterField
        ↓
Canvas / WebGL engines
        ↓
mandatory SafetyPass
        ↓
quiet chrome + provenance
```

Simulation metrics remain Python-authoritative. UI never becomes the source of truth.

## Documentation

| Doc | Purpose |
|---|---|
| [`PLANS.md`](PLANS.md) | Product phases + gates |
| [`docs/CONTINUATION_PLAN.md`](docs/CONTINUATION_PLAN.md) | P0–P2 web queue |
| [`docs/VISUAL_EXPERIENCES.md`](docs/VISUAL_EXPERIENCES.md) | Live Experience guide |
| [`docs/PHENOMENOLOGY_PIPELINE.md`](docs/PHENOMENOLOGY_PIPELINE.md) | Scraped → overlays |
| [`docs/BROWSER_CAPABILITY_MATRIX.md`](docs/BROWSER_CAPABILITY_MATRIX.md) | Device QA matrix |
| [`docs/contracts/frozen/API_V1_FREEZE.md`](docs/contracts/frozen/API_V1_FREEZE.md) | Contract freeze prep |
| [`docs/PHASE4_USABILITY.md`](docs/PHASE4_USABILITY.md) | Usability checklist |
| [`MOBILE_PWA_GUIDE.md`](MOBILE_PWA_GUIDE.md) | PWA guidance |
| [`docs/IOS_MIGRATION.md`](docs/IOS_MIGRATION.md) | Deferred native notes |

## API

Canonical browser API is **`/api/v1`**. Legacy `/api/*` and `/simulate/` remain mirrored.

OpenAPI: [`docs/contracts/openapi.json`](docs/contracts/openapi.json) · interactive `/docs` when the server is running.

## Non-claims

Modeled phenomenology for research and visualization only.  
Not medical, diagnostic, or therapeutic advice.  
Motifs/parameters are **INFERRED**; source existence is **OBSERVED**.

## Contributing

- Keep simulation outputs deterministic for fixed seeds/params
- Prefer `/api/v1` for new routes; update OpenAPI snapshot
- Do not bypass the visual safety pass
- Do not add medical/healing claims to UI copy
- Native iOS work stays out of the web track unless Phase 4 gates pass

```bash
python3 -m pytest tests/ -q
python3 scripts/export_openapi.py
python3 scripts/build_experience_catalog.py
```

## License

MIT — see [`LICENSE`](LICENSE).

**Applied Alchemy Labs**
