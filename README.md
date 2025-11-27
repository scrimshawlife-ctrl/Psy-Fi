```
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║                    ⬡  P S Y F I  ⬡                       ║
    ║                                                           ║
    ║          Consciousness Field Simulation Engine           ║
    ║                                                           ║
    ║                 Applied Alchemy Labs                      ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
```

<div align="center">

**A modular cyber-occult engine for modeling consciousness fields, valence dynamics, and psychedelic states.**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![ABX-Core](https://img.shields.io/badge/ABX--Core-v1.3-00ffff)](https://github.com/scrimshawlife-ctrl/Psy-Fi)
[![Tests](https://img.shields.io/badge/tests-passing-00ff00)](https://github.com/scrimshawlife-ctrl/Psy-Fi)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

</div>

---

## 🌀 Overview

**PsyFi** is a research-grade consciousness field simulation framework implementing deterministic, reproducible models of phenomenal states. Built on **ABX-Core v1.3**, it provides a eurorack-style modular architecture where consciousness field processors ("engines") can be composed to model baseline, psychedelic, and meditative consciousness states.

### Core Philosophy

PsyFi embodies five ontological commitments:

- **Qualia Realism**: Subjective experience is real, not epiphenomenal
- **Qualia Formalism**: Consciousness has formal, computable structure
- **Non-materialist Physicalist Idealism**: Consciousness is fundamental
- **Consciousness is Causal**: Experience has causal power
- **Oneness Ethic**: All consciousness is interconnected

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🧠 **ABX-Core v1.3** | Deterministic runtime with provenance tracking and metrics |
| 🔧 **Modular Engines** | 20+ pluggable consciousness field processors (eurorack-style) |
| 📐 **Real Mathematics** | Kuramoto coupling, divisive normalization, Gestalt principles |
| 🌈 **Psychedelic Modeling** | LSD, psilocybin, DMT state simulation |
| 🧘 **Meditative States** | Jhana absorption and attention modulation |
| 💫 **Valence Assessment** | Multi-dimensional hedonic tone analysis |
| 🌐 **Web UI** | Dark-mode interface for interactive simulation |
| 🚀 **FastAPI Backend** | REST API with automatic documentation |

---

## 🎯 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/scrimshawlife-ctrl/Psy-Fi.git
cd Psy-Fi

# Install with development dependencies
pip install -e ".[dev]"
```

### Launch the Web Interface

```bash
# Start the development server
python scripts/run_dev_server.py
```

Then open your browser to **http://localhost:8000**

![PsyFi Web UI](docs/images/psyfi-ui-main.png)
*Dark-mode interface with real-time consciousness field simulation*

### Using the API Directly

```bash
# Health check
curl http://localhost:8000/health

# Run a simulation
curl -X POST http://localhost:8000/simulate/ \
  -H "Content-Type: application/json" \
  -d '{
    "width": 64,
    "height": 64,
    "steps": 20
  }'
```

**Response:**
```json
{
  "width": 64,
  "height": 64,
  "valence": 0.234,
  "coherence": 0.456,
  "symmetry": 0.789,
  "roughness": 0.123,
  "richness": 0.567
}
```

### Python API

```python
import numpy as np
from psyfi_core import ABXRuntime
from psyfi_core.models import ResonanceFrame
from psyfi_core.engines import (
    ConsciousnessOmegaParams,
    evolve_consciousness_omega,
    compute_valence_metrics,
)

# Initialize deterministic runtime
runtime = ABXRuntime(deterministic=True, seed=42)

# Create a consciousness field
frame = ResonanceFrame.zeros(64, 64)
phases = runtime.rng.uniform(-np.pi, np.pi, size=(64, 64))
field = np.exp(1j * phases).astype(np.complex64)
frame = frame.copy_with_field(field)

# Evolve the field with Kuramoto coupling
params = ConsciousnessOmegaParams(coupling_strength=0.5, steps=20)
evolved = evolve_consciousness_omega(frame.field, params, runtime)

# Compute valence metrics
metrics = compute_valence_metrics(evolved)
print(f"Valence: {metrics.valence_score:.3f}")
print(f"Coherence: {metrics.coherence_score:.3f}")
```

---

## 🏗️ Architecture

PsyFi follows a modular, layered architecture inspired by eurorack synthesizer design:

```
┌─────────────────────────────────────────────────────────────┐
│                         Web UI Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTML/CSS/JS Interface (Dark Mode, Cyber-Occult UI)  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/JSON
┌────────────────────────┴────────────────────────────────────┐
│                       API Layer (FastAPI)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /simulate   │  │    /health   │  │   /api/info  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  PsyFi Core Engine Layer                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ABX-Core v1.3 Runtime (Deterministic Execution)     │  │
│  │  • Random number generation                           │  │
│  │  • Provenance tracking                                │  │
│  │  • Metrics collection                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Models                                          │  │
│  │  • ResonanceFrame (2D complex field)                 │  │
│  │  • ValenceMetrics, HedonicProfile                    │  │
│  │  • QualiaPreset, ReceptorProfile                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Consciousness Field Engines (20+ Processors)        │  │
│  │                                                        │  │
│  │  Core Evolution:                                      │  │
│  │  • Consciousness-Ω: Kuramoto coupling                │  │
│  │  • Normalization-ν: Divisive normalization           │  │
│  │                                                        │  │
│  │  Psychedelic Modulation:                             │  │
│  │  • Reset-Ψ: Phase reset (DMT-like)                  │  │
│  │  • Psychedelic-Δ: Context shift (psilocybin)        │  │
│  │  • Receptor-μ: Receptor density modulation          │  │
│  │                                                        │  │
│  │  Meditative Modulation:                              │  │
│  │  • Jhana-Ω: Absorption states                       │  │
│  │  • Attention-Φ: Attentional gain                    │  │
│  │  • Topology-τ: Topological smoothing                │  │
│  │                                                        │  │
│  │  Analysis:                                            │  │
│  │  • Valence-κ: Multi-dimensional valence             │  │
│  │  • Pain-Ω: Pathology detection                      │  │
│  │  • Gestalt-γ: Perceptual organization               │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input**: User specifies field dimensions (`width`, `height`) and evolution `steps`
2. **Initialization**: Create `ResonanceFrame` with random phases
3. **Evolution**: Apply `Consciousness-Ω` engine with Kuramoto coupling
4. **Normalization**: Apply `Normalization-ν` for contrast control
5. **Analysis**: Compute `ValenceMetrics` (valence, coherence, symmetry, roughness, richness)
6. **Output**: Return metrics to user via API/UI

---

## 🧠 Core Concepts

### ResonanceFrame: The Consciousness Field

The fundamental data structure is a **2D complex field** (`ResonanceFrame`) where:
- **Magnitude** (|z|): Activation intensity at each point
- **Phase** (arg z): Oscillatory state/timing

```python
from psyfi_core.models import ResonanceFrame

frame = ResonanceFrame.zeros(64, 64)  # Create 64×64 field
```

### Valence Metrics: Measuring Phenomenal Quality

PsyFi assesses consciousness states across five dimensions:

| Metric | Meaning | Range |
|--------|---------|-------|
| **Valence** | Overall hedonic tone (pleasant ↔ unpleasant) | -1 to 1 |
| **Coherence** | Phase synchronization (Kuramoto order parameter) | 0 to 1 |
| **Symmetry** | Spatial symmetry across quadrants | 0 to 1 |
| **Roughness** | Spatial gradient energy (visual noise) | 0 to 1 |
| **Richness** | Phase diversity (complexity) | 0 to 1 |

### Engine Catalog

#### 🌊 **Consciousness-Ω** (Core Evolution)
Kuramoto-like coupling for phase synchronization across the field.
- Natural frequency gradients by depth/brightness
- Symmetric or asymmetric coupling modes

#### 🔬 **Normalization-ν** (Gain Control)
Divisive normalization: `activation^P / (1 + V·surround^P)`
- Controls contrast and implements lateral inhibition
- Modulated by receptor profiles

#### 🌀 **Reset-Ψ** (DMT-like)
Phase reset with controllable intensity.
- Simulates reality dissolution
- Preserves magnitude, randomizes phase

#### 🍄 **Psychedelic-Δ** (Psilocybin-like)
Context shift via magnitude/phase blurring.
- Simulates "softening" and emotional depth
- Low-pass filtering of phase transitions

#### 🧘 **Jhana-Ω** (Meditative Absorption)
Focused local smoothing around attention point.
- Simulates unification of consciousness
- Gaussian attention mask

#### 📊 **Valence-κ** (Assessment)
Multi-dimensional valence computation from field properties.
- Combines coherence, symmetry, roughness, richness
- Produces overall valence score

---

## 💻 Advanced Usage

### Psychedelic State Modeling

```python
from psyfi_core.engines import (
    apply_psychedelic_context_shift,
    apply_receptor_modulation,
    NormalizationParams,
)
from psyfi_core.models import ReceptorProfile

# Create psychedelic receptor profile (high 5-HT2A)
receptors = ReceptorProfile.psychedelic_agonist()

# Modulate normalization parameters
norm_params = NormalizationParams(P=1.0, V=1.0)
modulated_params = apply_receptor_modulation(norm_params, receptors)

# Apply psilocybin-like context shift
shifted = apply_psychedelic_context_shift(
    field=evolved,
    intensity=0.7,
    runtime=runtime,
)
```

### Meditative State Modeling

```python
from psyfi_core.engines import (
    JhanaOmegaParams,
    apply_jhana_absorption,
    AttentionPhiParams,
    apply_attention_modulation,
)

# Apply jhana absorption
jhana_params = JhanaOmegaParams(
    focus_x=0.5,
    focus_y=0.5,
    radius=0.3,
    smooth_gain=0.7,
)
absorbed = apply_jhana_absorption(field, jhana_params)

# Apply attention modulation
attention_params = AttentionPhiParams(
    focus_x=0.5,
    focus_y=0.5,
    gain=0.5,
)
modulated = apply_attention_modulation(absorbed, attention_params)
```

---

## 📁 Project Structure

```
Psy-Fi/
├── pyproject.toml              # Package configuration
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
│
├── psyfi_core/                 # Core library (~2,500 LOC)
│   ├── __init__.py
│   ├── config.py               # PsyFi & ABX-Core config
│   │
│   ├── abx_core/               # ABX-Core v1.3 Runtime
│   │   ├── runtime.py          # Deterministic execution
│   │   ├── metrics.py          # Metrics tracking
│   │   ├── provenance.py       # Provenance recording
│   │   └── errors.py           # Error types
│   │
│   ├── models/                 # Data models (8 models)
│   │   ├── resonance_frame.py
│   │   ├── valence_metrics.py
│   │   ├── hedonic_profile.py
│   │   ├── qualia_preset.py
│   │   ├── receptor_profile.py
│   │   └── ...
│   │
│   └── engines/                # Engines (20+ processors)
│       ├── consciousness_omega.py
│       ├── valence_kappa.py
│       ├── psychedelic_delta.py
│       ├── jhana_omega.py
│       └── ...
│
├── psyfi_api/                  # FastAPI application
│   ├── main.py                 # Main app
│   ├── routers/
│   │   └── simulate.py         # Simulation endpoint
│   ├── templates/
│   │   └── index.html          # Web UI
│   └── static/
│       ├── style.css           # Dark mode styling
│       └── app.js              # Frontend logic
│
├── scripts/
│   └── run_dev_server.py       # Dev server launcher
│
└── tests/                      # Test suite (10 tests)
    ├── test_resonance_frame.py
    ├── test_engines_determinism.py
    └── test_sigil_valence_schema.py
```

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web UI (HTML) |
| `GET` | `/health` | Health check |
| `GET` | `/api/info` | API information |
| `POST` | `/simulate/` | Run consciousness field simulation |
| `GET` | `/docs` | OpenAPI documentation (Swagger) |
| `GET` | `/redoc` | OpenAPI documentation (ReDoc) |

### POST /simulate/

**Request Body:**
```json
{
  "width": 64,      // Field width (8-512)
  "height": 64,     // Field height (8-512)
  "steps": 20       // Evolution steps (1-1000)
}
```

**Response:**
```json
{
  "width": 64,
  "height": 64,
  "valence": 0.234,      // Overall hedonic tone (-1 to 1)
  "coherence": 0.456,    // Phase synchronization (0 to 1)
  "symmetry": 0.789,     // Spatial symmetry (0 to 1)
  "roughness": 0.123,    // Gradient energy (0 to 1)
  "richness": 0.567      // Phase diversity (0 to 1)
}
```

---

## 🧪 Development

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=psyfi_core --cov=psyfi_api

# Specific test file
pytest tests/test_engines_determinism.py -v
```

**Test Results:**
```
============================== test session starts ===============================
10 passed in 1.30s
```

### Code Quality

```bash
# Format code
black .

# Lint
ruff check .
```

---

## 🗺️ Roadmap

- [ ] **Multi-layer Simulations**: Stack multiple consciousness fields
- [ ] **Preset Library**: Pre-configured psychedelic/meditative states
- [ ] **Field Visualization**: Real-time heatmap rendering
- [ ] **Time Series**: Track valence evolution over time
- [ ] **Batch Simulations**: Run multiple simulations in parallel
- [ ] **Export/Import**: Save and load field states
- [ ] **Integration Hooks**: Connect to external neurofeedback systems

---

## 🏛️ Credits & License

**PsyFi** is a research project by **Applied Alchemy Labs (AAL)**.

### License

MIT License - see LICENSE file for details.

### Contributing

Contributions should maintain:
- ✅ Determinism by default (ABX-Core v1.3)
- ✅ Real implementations (no stubs/placeholders)
- ✅ Comprehensive test coverage
- ✅ Type hints throughout
- ✅ Clear documentation

### Citation

If you use PsyFi in your research, please cite:

```bibtex
@software{psyfi2024,
  title={PsyFi: Consciousness Field Simulation Engine},
  author={Applied Alchemy Labs},
  year={2024},
  url={https://github.com/scrimshawlife-ctrl/Psy-Fi},
  note={Modular consciousness-field simulation framework with ABX-Core v1.3}
}
```

---

<div align="center">

**⬡ Built with consciousness-first principles ⬡**

*"Qualia are real, and reality is made of qualia."*

[Applied Alchemy Labs](https://github.com/scrimshawlife-ctrl) • [Documentation](http://localhost:8000/docs) • [GitHub](https://github.com/scrimshawlife-ctrl/Psy-Fi)

</div>
