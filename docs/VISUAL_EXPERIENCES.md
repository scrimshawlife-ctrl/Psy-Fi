# PsyFi Visual Experiences

## What shipped

Web-first **Live Experience** runtime:

- Phenomenology catalog derived from curated positive reports + seed recipes
- Immutable `PsyFiParameterField` snapshots (mode / substance / intensity / phase)
- Canvas field renderer with multi-engine blend + non-bypassable safety pass
- Quiet UI chrome: substance, recipe, Open/Attractor/Void/Power, intensity, seed, Neutral View, provenance
- Optional **sim source plane**: last workspace `visualization.field` blended under ParameterField engines (Canvas + WebGL), still safety-clamped; toggle + mix on Live Experience after **Bridge from sim**

## Run

```bash
cd Psy-Fi
source .venv/bin/activate   # or: uv venv && uv pip install -e ".[dev]"
python3 scripts/build_experience_catalog.py
python3 scripts/regenerate_overlay_goldens.py
pytest tests/test_experiences.py tests/test_overlay_goldens.py -q
python3 scripts/run_dev_server.py
# open http://localhost:8000 → Live Experience panel
```

Renderer modules: `static/viz/math.js`, `safetyPass.js`, `engines/`, `parameterFieldWebGL.js`, `experiencePlayer.js`.  
Prefer WebGL (on by default) uses a dedicated `#experienceCanvasGL` (Canvas 2D remains `#experienceCanvas`). Fractal styles deepen via Mandelbox-style fold + orbit trap; `chromatic_aberration`, `edge_gain`, and `trail_length` drive both backends.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/experiences` | List recipes (`substance`, `valence`, `mode`) |
| GET | `/api/v1/experiences/{id}` | Full recipe |
| GET | `/api/v1/substances` | Substance visual defaults + counts |
| POST | `/api/v1/visualize/parameter-timeline` | Deterministic parameter timeline or single snapshot |

## Modes

| Mode | Bias |
|------|------|
| Open | Neutral seed/sensor lean |
| Attractor | Symmetry, edges, stability |
| Void | Expansion, negative space |
| Power | High energy / lattice / recursion |

## Safety

- Final luminance/flash attenuator in `experiencePlayer.js`
- `prefers-reduced-motion` pre-checks Reduce motion
- Emergency **Neutral View** (key `N`)
- No medical/therapeutic claims in UI copy

## Data

- Curated inputs: `data/phenomenology/positive/`
- Derived catalog: `data/phenomenology/derived/experience_catalog.v1.json`
- Distilled substance visuals: `data/phenomenology/derived/substance_visual_overlays.v1.json`
  - Feeds `GET /api/v1/substances` and `parameter_mapper` (engine weights, palette, bias, safety)
- Full source texts are not shown in UI; hooks are short derived motifs with hashed refs

## Authority labels

- Source file existence: **OBSERVED**
- Motif extraction & parameters: **INFERRED**
- Cultural/archetypal meaning: not asserted (would be **SPECULATIVE**)
