# PsyFi README Integration Snippets

This document provides ready-to-use snippets for integrating PsyFi graphics into your README.md file.

---

## Header Graphics

### Option A: Sigil Console Hero

```html
<div align="center">
  <img src="docs/images/psyfi-header-a.svg" alt="PsyFi - Consciousness Field Engine" width="100%">
</div>
```

**Markdown Alternative:**
```markdown
![PsyFi Header](docs/images/psyfi-header-a.svg)
```

### Option B: Oscillatory Lattice Hero

```html
<div align="center">
  <img src="docs/images/psyfi-header-b.svg" alt="PsyFi - Applied Alchemy Labs" width="100%">
</div>
```

---

## Footer Graphics

### Option A: AAL Sigil Plate

```html
<div align="center">
  <img src="docs/images/psyfi-footer-a.svg" alt="Applied Alchemy Labs - PsyFi Module" width="100%">
</div>
```

### Option B: Minimal Cyan Line Seal

```html
<div align="center">
  <img src="docs/images/psyfi-footer-b.svg" alt="AAL - PsyFi" width="100%">
</div>
```

---

## Icon Usage

### Inline Icons (24px)

```html
<img src="docs/icons/pf-icon-core-sigil-24.svg" alt="Core Sigil" width="24" height="24" />
```

### Large Icons (48px)

```html
<img src="docs/icons/pf-icon-core-sigil-48.svg" alt="Core Sigil" width="48" height="48" />
```

### Icons with Text

```html
<p>
  <img src="docs/icons/pf-icon-psychedelic-24.svg" alt="Psychedelic" width="20" height="20" align="absmiddle" />
  <strong>Psychedelic Simulation</strong> — Classic tryptamine field dynamics
</p>
```

---

## Complete README Template

```markdown
<div align="center">
  <img src="docs/images/psyfi-header-a.svg" alt="PsyFi - Consciousness Field Engine" width="100%">
</div>

# PsyFi

**Modular Consciousness Field Simulation Engine**

[![ABX-Core](https://img.shields.io/badge/ABX--Core-v1.3-3EE7F2?style=flat-square)](https://github.com/applied-alchemy-labs)
[![Python](https://img.shields.io/badge/Python-3.10+-FF42C1?style=flat-square)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-8F7BFF?style=flat-square)](LICENSE)

> A deterministic, reproducible consciousness field simulator with ABX-Core v1.3 hardening. Built by Applied Alchemy Labs.

---

## Features

- 🔬 **Deterministic Runtime** — Fully reproducible simulations with seed control
- 🧠 **20+ Substance Presets** — Psychedelics, dissociatives, empathogens, and more
- 🎨 **Phenomenological Modeling** — Visual signatures, emotional dynamics, temporal phases
- ⚡ **Real Mathematics** — Kuramoto coupling, divisive normalization, FFT processing
- 🛡️ **Safety Defaults** — Built-in parameter clamping and boundary enforcement
- 🌐 **Web Interface** — Dark-mode UI with PWA support and mobile optimization

---

## Quick Start

\`\`\`bash
# Install
pip install -e .

# Run API
cd psyfi_api
uvicorn main:app --reload

# Visit http://localhost:8000
\`\`\`

---

## Architecture

\`\`\`
psyfi/
├── psyfi_core/         # Core consciousness field engines
│   ├── abx_core/       # ABX-Core v1.3 runtime
│   ├── models/         # Data models + substance presets
│   ├── engines/        # Field processing engines
│   └── presets/        # Substance preset database
├── psyfi_api/          # FastAPI backend + web UI
│   ├── templates/      # HTML templates
│   └── static/         # CSS, JS, PWA assets
├── docs/               # Design system + graphics
│   ├── images/         # Header/footer SVGs
│   ├── icons/          # PsyFi icon family
│   └── style/          # CSS design tokens
└── tests/              # Pytest test suite
\`\`\`

---

## Substance Presets

PsyFi includes 22 scientifically-informed substance presets for phenomenological modeling:

### Classic Psychedelics
- LSD, Psilocybin, DMT, 5-MeO-DMT, Mescaline
- 2C-B, 2C-E, AL-LAD, ETH-LAD
- Harmalas (MAOI)

### Dissociatives
- Ketamine, MXE, DXM

### Empathogens
- MDMA, MDA

### Deliriants
- DPH, Scopolamine

### Stimulants
- Amphetamine, Cocaine, Methylphenidate

### Baselines
- Baseline, Jhana (meditative), REM Dream

[View full preset database →](psyfi_core/presets/substance_presets.json)

---

## Usage

\`\`\`python
from psyfi_core.models.substance_preset import load_preset
from psyfi_core.models.preset_integration import apply_preset

# Load a preset
lsd = load_preset("lsd")
print(f"5-HT2A affinity: {lsd.mechanism.ht2a_5}")

# Apply to field parameters
params = apply_preset("psilocybin", intensity=0.7, safety_clamp=True)

# Simulate consciousness field
from psyfi_api.main import run_simulation
result = run_simulation(width=128, height=128, steps=50, preset="dmt")
\`\`\`

---

## Safety & Ethics

- ⚠️ **Research Use Only** — All presets are for simulation and educational purposes
- 🛡️ **Built-in Safety** — Parameter clamping prevents extreme or unsafe values
- 📊 **Phenomenological Focus** — Models subjective effects, not pharmacokinetics
- 🔬 **No Medical Claims** — Not for diagnosis, treatment, or harm reduction

---

## Development

\`\`\`bash
# Run tests
pytest -xvs

# Check coverage
pytest --cov=psyfi_core --cov-report=html

# Type checking
mypy psyfi_core

# Linting
ruff check psyfi_core
\`\`\`

---

## Documentation

- [Design System](docs/FIGMA_GUIDE.md)
- [API Documentation](http://localhost:8000/docs)
- [Substance Presets](psyfi_core/presets/README.md)
- [Mobile & PWA Guide](MOBILE_PWA_GUIDE.md)

---

## License

MIT © Applied Alchemy Labs

---

<div align="center">
  <img src="docs/images/psyfi-footer-a.svg" alt="Applied Alchemy Labs - PsyFi Module" width="100%">
</div>
\`\`\`

---

## Badge Styles

### PsyFi Branded Badges

```markdown
![ABX-Core](https://img.shields.io/badge/ABX--Core-v1.3-3EE7F2?style=flat-square)
![PsyFi](https://img.shields.io/badge/PsyFi-v1.0-FF42C1?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10+-8F7BFF?style=flat-square)
```

### Status Badges

```markdown
![Tests](https://img.shields.io/badge/Tests-10%20Passing-38D996?style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-95%25-38D996?style=flat-square)
![Build](https://img.shields.io/badge/Build-Passing-38D996?style=flat-square)
```

---

## Light Mode Compatibility

For repositories with light mode README viewing:

```html
<!-- Dark mode (default) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/psyfi-header-a.svg">
  <!-- Light mode alternative: add white background -->
  <source media="(prefers-color-scheme: light)" srcset="docs/images/psyfi-header-a.svg">
  <img src="docs/images/psyfi-header-a.svg" alt="PsyFi" width="100%">
</picture>
```

---

## Table of Contents Template

```markdown
## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Substance Presets](#substance-presets)
- [Usage](#usage)
- [Safety & Ethics](#safety--ethics)
- [Development](#development)
- [Documentation](#documentation)
- [License](#license)
```

---

**Applied Alchemy Labs | PsyFi v1.0**
