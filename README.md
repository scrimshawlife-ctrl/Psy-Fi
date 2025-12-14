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

### 🚀 One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/scrimshawlife-ctrl/Psy-Fi)
[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fscrimshawlife-ctrl%2FPsy-Fi%2Fmain%2Fazure-deploy.json)
[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run?git_repo=https://github.com/scrimshawlife-ctrl/Psy-Fi)

[Deployment Guide](deploy-buttons.md) • [Manual Setup](DEPLOYMENT.md)

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
| 🌈 **Psychedelic Modeling** | LSD, psilocybin, DMT state simulation with 22+ substance presets |
| 🧘 **Meditative States** | Jhana absorption and attention modulation |
| 💫 **Valence Assessment** | Multi-dimensional hedonic tone analysis |
| 🎹 **MIDI Integration** | Real-time control via MIDI controllers, DAWs, and hardware |
| 🌐 **Web UI** | Comprehensive 4-panel interface with real-time visualization |
| 🎛️ **Admin Panel** | System monitoring, run history, engine registry at /admin |
| 🔌 **Overlay Server** | Capability-based API with full provenance tracking |
| 🚀 **FastAPI Backend** | REST API with automatic documentation |
| 📱 **Mobile & PWA** | Progressive Web App with offline support |

---

## 🎯 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/scrimshawlife-ctrl/Psy-Fi.git
cd Psy-Fi

# Install with development dependencies
pip install -e ".[dev]"

# Optional: Install MIDI support
pip install mido python-rtmidi
```

### Launch the Web Interface (FastAPI)

```bash
# Start the development server
python scripts/run_dev_server.py
```

Then open your browser to **http://localhost:8000**

![PsyFi Web UI](docs/images/psyfi-ui-main.png)
*Dark-mode interface with real-time consciousness field simulation*

### Launch the Overlay Server (Capability-Based API)

```bash
# Start the overlay server
python -m psyfi_overlay.server

# Custom host/port
python -m psyfi_overlay.server --host 0.0.0.0 --port 8787
```

Then test with:

```bash
# Ping capability
curl -X POST http://localhost:8787/run \
  -H "Content-Type: application/json" \
  -d '{"capability": "psyfi.ping", "input": {}}'

# Run simulation with provenance
curl -X POST http://localhost:8787/run \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "psyfi.simulate",
    "input": {"width": 64, "height": 64, "steps": 20, "seed": 42},
    "seed": "deterministic-seed"
  }'
```

See [OVERLAY_API.md](docs/OVERLAY_API.md) for full documentation of all capabilities.

### Using the FastAPI Directly

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

## 🎨 Web Interface Features

PsyFi features a comprehensive 4-panel interface for interactive consciousness field simulation:

### Main Interface

**Top Bar**
- **Scenario Dropdown**: 17 substance presets (LSD, Psilocybin, DMT, Ketamine, MDMA, Jhana, REM Dream, etc.)
- **Seed Control**: Deterministic simulation with seed values
- **Generate Button**: Trigger simulations with one click
- **Status Pill**: Real-time status (Ready → Computing → Complete)

**Left Panel: Field Configuration**
- **Field Geometry**: Width, Height, Depth (future 3D support)
- **Initial Conditions**: Evolution steps, noise scale, initialization mode
- **Consciousness Context**: Intention field (experimental semantic encoding)

**Center Panel: Visualization**
- **Canvas Display**: Real-time magnitude heatmap with cyan-magenta-yellow colormap
- **Metrics Display**: Valence, coherence, symmetry, roughness, richness

**Right Panel: Engine Controls**
- **Engine Modules**: Toggle switches for consciousness processors
  - consciousness_omega (Kuramoto coupling)
  - psychedelic_reset (Phase reset dynamics)
  - jhana_attractor (Meditative absorption)
  - valence_analyzer (Hedonic assessment)
  - pain_modulator (Suffering dynamics)

**Advanced Drawer** (press `D` or click handle)
- **Console Logs**: Real-time operation logging
- **Raw JSON**: Complete API response data
- **Debug Info**: Browser, timestamp, session ID

### Admin Panel (`/admin`)

Access the admin panel at **http://localhost:8000/admin** for system monitoring:

- **System Status**: Version, ABX-Core, engine count, preset count
- **Engine Registry**: All 20 consciousness field processors with categories
- **Substance Presets**: 22 pharmacological models with receptor profiles
- **Configuration**: Environment, safety clamp, field size limits
- **Run History**: Table of all simulations with metrics and timing
- **Auto-Refresh**: Updates every 30 seconds

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Run simulation |
| `D` | Toggle advanced debug drawer |
| `Esc` | Close drawer |

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
│  │  /simulate   │  │  /api/midi   │  │    /health   │     │
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

### MIDI Real-Time Control

```python
from psyfi_core.midi import MIDIService, MIDIConfig

# Configure MIDI
config = MIDIConfig(
    input_device="Launchpad Mini",  # Your MIDI controller
    channel=0,
    cc_smooth_factor=0.1,
)

# Create and start MIDI service
midi = MIDIService(config)
midi.open(input_device="Launchpad Mini")
midi.start()

# Now control PsyFi parameters in real-time:
# - CC1 (Modulation) → phase_noise
# - CC7 (Volume) → coupling_strength
# - Notes C4-A4 → Trigger substance presets

# Get current MIDI-controlled parameters
params = midi.get_params()
print(params)  # {'phase_noise': 0.45, 'coupling_strength': 0.7, ...}

# Clean up
midi.close()
```

**Control from REST API:**

```bash
# Start MIDI service
curl -X POST http://localhost:8000/api/midi/start \
  -H "Content-Type: application/json" \
  -d '{"input_device": "Launchpad Mini", "channel": 0}'

# Get current status
curl http://localhost:8000/api/midi/status

# Send MIDI CC
curl -X POST http://localhost:8000/api/midi/send/cc \
  -d '{"control": 1, "value": 64}'

# Trigger preset
curl -X POST http://localhost:8000/api/midi/send/note \
  -d '{"note": 61, "velocity": 100}'  # LSD preset
```

See [docs/MIDI.md](docs/MIDI.md) for complete integration guide including DAW setup, hardware controllers, and bidirectional MIDI.

---

## 📁 Project Structure

```
Psy-Fi/
├── pyproject.toml              # Package configuration
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
│
├── psyfi_core/                 # Core library (~3,500 LOC)
│   ├── __init__.py
│   ├── config.py               # PsyFi & ABX-Core config
│   │
│   ├── abx_core/               # ABX-Core v1.3 Runtime
│   │   ├── runtime.py          # Deterministic execution
│   │   ├── metrics.py          # Metrics tracking
│   │   ├── provenance.py       # Provenance recording
│   │   └── errors.py           # Error types
│   │
│   ├── models/                 # Data models
│   │   ├── resonance_frame.py
│   │   ├── valence_metrics.py
│   │   ├── hedonic_profile.py
│   │   ├── qualia_preset.py
│   │   ├── receptor_profile.py
│   │   ├── substance_preset.py # Substance preset system
│   │   ├── preset_integration.py
│   │   └── ...
│   │
│   ├── engines/                # Engines (20+ processors)
│   │   ├── consciousness_omega.py
│   │   ├── valence_kappa.py
│   │   ├── psychedelic_delta.py
│   │   ├── jhana_omega.py
│   │   └── ...
│   │
│   ├── midi/                   # MIDI integration
│   │   ├── service.py          # MIDIService (I/O, mappings)
│   │   └── __init__.py
│   │
│   └── presets/                # Substance preset database
│       ├── substance_presets.json   # 22+ substances
│       └── substance_schema.json
│
├── psyfi_api/                  # FastAPI application
│   ├── main.py                 # Main app
│   ├── routers/
│   │   ├── simulate.py         # Simulation endpoint
│   │   └── midi.py             # MIDI control endpoints
│   ├── templates/
│   │   └── index.html          # Web UI
│   └── static/
│       ├── style.css           # Dark mode styling
│       └── app.js              # Frontend logic
│
├── docs/                       # Documentation
│   ├── MIDI.md                 # MIDI integration guide
│   ├── DEPLOYMENT.md           # Deployment guide
│   ├── MOBILE_PWA_GUIDE.md     # Mobile/PWA guide
│   ├── images/                 # Graphics (headers, icons)
│   └── style/                  # CSS design system
│
├── examples/                   # Usage examples
│   ├── midi_basic.py           # Basic MIDI control
│   ├── midi_daw_integration.py # DAW integration
│   └── midi_api_client.py      # REST API client
│
├── scripts/
│   ├── run_dev_server.py       # Dev server launcher
│   └── deploy.sh               # Deployment helper
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
| `GET` | `/api/midi/devices` | List MIDI devices |
| `POST` | `/api/midi/start` | Start MIDI service |
| `POST` | `/api/midi/stop` | Stop MIDI service |
| `GET` | `/api/midi/status` | Get MIDI status |
| `GET` | `/api/midi/mappings` | Get MIDI control mappings |
| `POST` | `/api/midi/send/cc` | Send MIDI CC message |
| `POST` | `/api/midi/send/note` | Send MIDI note |
| `GET` | `/api/midi/params` | Get MIDI-controlled parameters |
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

- [x] **Preset Library**: 22+ substance presets with realistic pharmacology ✅
- [x] **MIDI Integration**: Real-time control via hardware/DAW ✅
- [x] **Mobile & PWA**: Progressive Web App with offline support ✅
- [x] **Deployment**: Docker, Railway, Render, Fly.io, Heroku configs ✅
- [ ] **Multi-layer Simulations**: Stack multiple consciousness fields
- [ ] **Field Visualization**: Real-time heatmap rendering in UI
- [ ] **Time Series**: Track valence evolution over time
- [ ] **Batch Simulations**: Run multiple simulations in parallel
- [ ] **Export/Import**: Save and load field states
- [ ] **Neurofeedback**: EEG/biometric integration via MIDI

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

[Applied Alchemy Labs](https://github.com/scrimshawlife-ctrl) • [Documentation](http://localhost:8000/docs) • [MIDI Guide](docs/MIDI.md) • [Deployment Guide](docs/DEPLOYMENT.md)

</div>
