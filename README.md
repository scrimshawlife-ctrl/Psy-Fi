# PsyFi - Consciousness Field Simulation Engine

PsyFi is a modular consciousness-field simulation framework with ABX-Core v1.3 deterministic runtime. It implements a eurorack-style architecture where consciousness field processors ("engines") can be composed to model various states of consciousness, including baseline, psychedelic, and meditative states.

## Features

- **ABX-Core v1.3**: Deterministic runtime with provenance tracking and metrics
- **Modular Engines**: 20+ pluggable consciousness field processors
- **Real Mathematics**: Kuramoto coupling, divisive normalization, Gestalt principles
- **Psychedelic Modeling**: LSD, psilocybin, DMT state simulation
- **Meditative States**: Jhana absorption and attention modulation
- **Valence Assessment**: Multi-dimensional hedonic tone analysis
- **FastAPI Interface**: REST API for simulations

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd Psy-Fi

# Install with development dependencies
pip install -e ".[dev]"
```

## Quick Start

### Running Tests

```bash
pytest tests/ -v
```

All tests should pass, validating determinism and core functionality.

### Starting the API Server

```bash
python scripts/run_dev_server.py
```

The API will be available at `http://localhost:8000`

### Using the API

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

Response:
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

## Architecture

### ABX-Core v1.3

The ABX-Core runtime provides:

- **Determinism**: Reproducible simulations with seed control
- **Provenance**: Tracks module chain and parameters
- **Metrics**: Compute steps, grid size, entropy proxy

```python
from psyfi_core import ABXRuntime

runtime = ABXRuntime(deterministic=True, seed=1337)
# Use runtime.rng for all random number generation
```

### Consciousness Field (ResonanceFrame)

The fundamental data structure is a 2D complex field where:
- **Magnitude**: Activation/intensity at each point
- **Phase**: Oscillatory state/timing

```python
from psyfi_core.models import ResonanceFrame

# Create a 64x64 field
frame = ResonanceFrame.zeros(64, 64)
```

### Engines

Engines are pure functions that transform consciousness fields:

#### Core Evolution
- **Consciousness Omega**: Kuramoto coupling for phase synchronization
- **Normalization Nu**: Divisive normalization for contrast control

#### Psychedelic Modulation
- **Reset Psi**: Phase reset (DMT-like)
- **Psychedelic Delta**: Context shift (psilocybin-like)
- **Receptor Mu**: Receptor density modulation

#### Meditative Modulation
- **Jhana Omega**: Absorption state (focused smoothing)
- **Attention Phi**: Attentional gain modulation
- **Topology Tau**: Topological smoothing

#### Analysis
- **Valence Kappa**: Multi-dimensional valence assessment
- **Pain Omega**: Negative valence / pathology detection
- **Gestalt Gamma**: Perceptual organization metrics

## Example Usage

### Basic Field Evolution

```python
import numpy as np
from psyfi_core import ABXRuntime
from psyfi_core.models import ResonanceFrame
from psyfi_core.engines import (
    ConsciousnessOmegaParams,
    evolve_consciousness_omega,
    compute_valence_metrics,
)

# Setup
runtime = ABXRuntime(deterministic=True, seed=42)
frame = ResonanceFrame.zeros(64, 64)

# Initialize with random phases
phases = runtime.rng.uniform(-np.pi, np.pi, size=(64, 64))
field = np.exp(1j * phases).astype(np.complex64)
frame = frame.copy_with_field(field)

# Evolve the field
params = ConsciousnessOmegaParams(
    coupling_strength=0.5,
    steps=20,
)
evolved = evolve_consciousness_omega(frame.field, params, runtime)

# Compute valence
valence = compute_valence_metrics(evolved)
print(f"Valence: {valence.valence_score:.3f}")
print(f"Coherence: {valence.coherence_score:.3f}")
```

### Psychedelic Context Shift

```python
from psyfi_core.engines import apply_psychedelic_context_shift

# Apply psilocybin-like effect
shifted = apply_psychedelic_context_shift(
    field=evolved,
    intensity=0.7,  # 0-1 range
    runtime=runtime,
)
```

### Meditative Absorption

```python
from psyfi_core.engines import JhanaOmegaParams, apply_jhana_absorption

params = JhanaOmegaParams(
    focus_x=0.5,  # Center of field
    focus_y=0.5,
    radius=0.3,
    smooth_gain=0.7,
)
absorbed = apply_jhana_absorption(evolved, params)
```

## Project Structure

```
psyfi/
├── pyproject.toml          # Package configuration
├── README.md               # This file
├── psyfi_core/            # Core library
│   ├── __init__.py
│   ├── config.py          # PsyFi and ABX-Core config
│   ├── abx_core/          # ABX-Core v1.3 runtime
│   │   ├── runtime.py
│   │   ├── metrics.py
│   │   ├── provenance.py
│   │   └── errors.py
│   ├── models/            # Data models
│   │   ├── resonance_frame.py
│   │   ├── qualia_preset.py
│   │   ├── hedonic_profile.py
│   │   ├── valence_metrics.py
│   │   └── ...
│   └── engines/           # Consciousness field processors
│       ├── consciousness_omega.py
│       ├── valence_kappa.py
│       ├── psychedelic_delta.py
│       └── ...
├── psyfi_api/             # FastAPI application
│   ├── main.py
│   └── routers/
│       └── simulate.py
├── scripts/               # Utility scripts
│   └── run_dev_server.py
└── tests/                 # Test suite
    ├── test_resonance_frame.py
    ├── test_engines_determinism.py
    └── test_sigil_valence_schema.py
```

## Ontological Commitments

PsyFi is built on specific philosophical assumptions (see `ontology_omega.py`):

- **Qualia Realism**: Subjective experience is real, not epiphenomenal
- **Qualia Formalism**: Consciousness has formal, computable structure
- **Non-materialist Physicalist Idealism**: Consciousness is fundamental
- **Consciousness is Causal**: Experience has causal power
- **Oneness Ethic**: All consciousness is interconnected

## Development

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=psyfi_core --cov=psyfi_api

# Run specific test file
pytest tests/test_engines_determinism.py -v
```

### Code Quality

```bash
# Format code
black .

# Lint
ruff check .
```

## API Documentation

When the server is running, interactive API docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

MIT

## Contributing

This is a research project for Applied Alchemy Labs. Contributions should maintain:
- Determinism by default (ABX-Core v1.3)
- Real implementations (no fake stubs)
- Comprehensive tests
- Type hints throughout

## Citation

If you use PsyFi in your research, please cite:

```bibtex
@software{psyfi2024,
  title={PsyFi: Consciousness Field Simulation Engine},
  author={Applied Alchemy Labs},
  year={2024},
  url={https://github.com/yourusername/psyfi}
}
```
