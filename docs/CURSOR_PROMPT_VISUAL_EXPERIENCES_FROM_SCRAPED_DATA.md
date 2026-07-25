# Cursor Prompt — PsyFi Visual Experiences from Scraped Phenomenology

**Copy everything below the line into Cursor as a single agent task.**

---

You are the principal engineer for **PsyFi** (`scrimshawlife-ctrl/Psy-Fi`).

## Mission

Build the **Phase 2 Visualization Runtime** for PsyFi: a web-first, multi-engine visual experience system driven by (1) existing substance presets, (2) a new phenomenology catalog derived from scraped positive user-experience data, and (3) the PsyFi Notion canon (Open / Attractor / Void / Power modes, immutable parameter field, safety pass, quiet chrome / expressive field).

Do **not** rebuild the full iOS Metal product in this pass. Do **not** invent medical, therapeutic, diagnostic, or consciousness-alteration claims. Model **phenomenology as simulation**, with provenance.

---

## Canonical product definition (must obey)

PsyFi is a **camera-capable, sensor-modulable psychedelic visualization instrument** and a **consciousness-field simulation workspace**.

Signal path (web-first realization):

```text
seed + substance/experience preset + optional sensor/touch/audio adapters
        ↓
normalized sensor/source field
        ↓
immutable PsyFiParameterField snapshot (per frame / per tick)
        ↓
visualization engines (multi-pass render graph)
        ↓
mandatory non-bypassable visual safety pass
        ↓
quiet UI chrome + provenance/results inspector
```

Core brand principle from Notion:
> **The field is expressive. The instrument is precise.**

Modes (from PsyFi v2.0 / one-shot canon — implement as field biases, not separate apps):

| Mode | Field bias |
|------|------------|
| **Open** | seed + sensors with no anomaly preference |
| **Attractor** | convergence, symmetry, dense recurring structure, stable edges |
| **Void** | negative space, expansion, low-density emergence, inversion |
| **Power** | strongest absolute anomaly / energy (attractor or void) |

UI principle: **expressive content, quiet interface**. Safety controls always available.

---

## Repo reality (inspect before coding)

Repo root: current workspace `Psy-Fi`.

### Already exists
- `psyfi_core/` — deterministic ABX runtime + modular engines (`consciousness_omega`, `psychedelic_delta`, `geometry_lambda`, `gestalt_gamma`, `valence_kappa`, etc.)
- `psyfi_core/presets/substance_presets.json` — rich presets including `visual_signature` for lsd, psilocybin, dmt, 5-meo-dmt, mescaline, ketamine, etc.
- `psyfi_api/` — FastAPI + simple HTML/JS UI (`templates/index.html`, `static/app.js`) that currently only runs `/simulate/` and shows metric cards — **no real field renderer yet**
- `docs/PLANS.md` — **web-first** sequence; Phase 2 is Visualization Runtime
- `docs/WEB_ARCHITECTURE.md` — renderer-independent visualization schema; Canvas/WebGL first, WebGPU optional
- `docs/DESIGN_SYSTEM.md` — tokens, quiet chrome, reduced-motion, accessibility
- Python authority remains the deterministic core; browser renders derived visualization state

### Does NOT exist yet (you will create)
- Experience phenomenology catalog from scraped trip reports
- Visualization schema package
- Multi-pass WebGL/Canvas experience engines
- Substance → parameter → shader mapping layer
- Live experience workspace UI (viewport + mode + intensity + safety)
- API endpoints for experiences / visual frames / catalog
- Tests + fixtures for deterministic visual parameter timelines

### Scraped data location (authoritative phenomenology inputs)
On the operator machine (or copy into repo under `data/` if present):

```text
/home/scrimshawlife/data/erowid_experiences/*.json
/home/scrimshawlife/data/positive_experiences/**/*.json
```

Each Erowid JSON roughly:
```json
{
  "source": "erowid",
  "url": "...",
  "substance": "lsd|dmt|psilocybin|pcp|...",
  "title": "...",
  "markdown": "full report text..."
}
```

Positive subset + X/Reddit samples live under `data/positive_experiences/`.

**If data is outside the repo**, copy a curated set into:
```text
Psy-Fi/data/phenomenology/raw/
Psy-Fi/data/phenomenology/positive/
```
Do not commit huge raw dumps if licenses/ToS are unclear — prefer a **derived, paraphrased, de-identified catalog** with source hashes and provenance labels.

---

## Hard constraints

### Do
1. Web-first implementation aligned with `PLANS.md` Phase 2.
2. Keep Python core as simulation authority; browser as visualization + interaction surface.
3. Build **renderer-independent** visualization/parameter schemas first, then WebGL/Canvas renderer.
4. Map scraped phenomenology → structured **experience recipes**, not raw text dump into shaders.
5. Support substances first: **LSD, psilocybin, DMT, 5-MeO-DMT, mescaline, ketamine**, plus baseline. PCP only as experimental/dissociative if safety-clamped; default library emphasizes **positive** phenomenology.
6. Implement Open / Attractor / Void / Power as parameter-field biases.
7. Implement intensity slider, Reduce Motion, Dim Flashing / flash-rate clamp, emergency **Neutral View** (≤100ms intent).
8. Preserve determinism: same seed + preset + fixture → same parameter timeline hash.
9. Label all interpretive content `OBSERVED | INFERRED | SPECULATIVE`.
10. Add tests, docs, fixtures, and a short engineering receipt.

### Do not
1. Medical / therapeutic / diagnostic claims or “healing engine” framing.
2. Claim intention alters quantum entropy.
3. Bypass safety pass.
4. Direct sensor→shader mutation (must go through parameter field).
5. Rainbow-spiral / generic AI-eye / wellness cliché as brand default.
6. Depend on Abraxas or Waykin runtimes.
7. Port full iOS Metal stack in this task (document iOS port notes only).
8. Ingest copyrighted report text wholesale into user-facing UI; use **derived motifs / parameters** with provenance references.
9. Flash >3 Hz in default presets; no uncontrolled fullscreen oscillation.
10. Break existing `/simulate/` API without versioning.

---

## Architecture to implement

### Target layout (incremental; keep current app working)

```text
Psy-Fi/
├── data/phenomenology/
│   ├── raw/                      # optional local-only raw scrapes
│   ├── positive/                 # curated positive sources
│   └── derived/
│       ├── experience_catalog.v1.json
│       ├── motif_lexicon.v1.json
│       └── substance_visual_overlays.v1.json
├── packages/                     # or docs-equivalent if monorepo not ready
│   └── visualization-schema/
│       ├── psyfi_parameter_field.v1.json
│       ├── psyfi_visual_frame.v1.json
│       ├── psyfi_experience_recipe.v1.json
│       └── README.md
├── psyfi_core/
│   ├── experiences/              # NEW
│   │   ├── catalog.py
│   │   ├── motif_extractor.py
│   │   ├── recipe_builder.py
│   │   └── parameter_mapper.py
│   ├── presets/substance_presets.json  # extend visual_signature if needed
│   └── engines/                  # existing + any pure-python visual field helpers
├── psyfi_api/
│   ├── routers/
│   │   ├── experiences.py        # NEW catalog/recipe endpoints
│   │   └── visualize.py          # NEW parameter timeline / frame helpers
│   ├── static/
│   │   ├── viz/
│   │   │   ├── parameterField.js
│   │   │   ├── safetyPass.js
│   │   │   ├── renderGraph.js
│   │   │   ├── engines/
│   │   │   │   ├── recursiveFeedback.js
│   │   │   │   ├── kaleidoscope.js
│   │   │   │   ├── flowField.js
│   │   │   │   ├── organicBloom.js
│   │   │   │   ├── voidExpansion.js
│   │   │   │   ├── entityLattice.js   # abstract, non-figurative “presence”
│   │   │   │   └── neutralView.js
│   │   │   └── experiencePlayer.js
│   │   ├── app.js                # extend: experience workspace
│   │   └── style.css
│   └── templates/index.html      # add Live Experience viewport
├── tests/
│   ├── test_experience_catalog.py
│   ├── test_parameter_mapper_determinism.py
│   └── fixtures/experiences/
└── docs/
    ├── VISUAL_EXPERIENCES.md
    ├── PHENOMENOLOGY_PIPELINE.md
    └── ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md
```

If introducing `packages/` is too heavy for one pass, keep schemas under `docs/schemas/` + `psyfi_core/experiences/schemas/` — but schemas must exist and be versioned.

---

## Data pipeline (scraped reports → visual experiences)

### Step A — Ingest & normalize
Build `psyfi_core/experiences/motif_extractor.py` (and a CLI script `scripts/build_experience_catalog.py`) that:

1. Loads JSON reports from `data/phenomenology/**`.
2. Extracts **structured motifs** (not full republication), e.g.:
   - geometry (mandala, lattice, floral geometric, symmetry order)
   - entities/presence (abstract: “presence density”, not cartoon elves)
   - color/light (opal, cyan, magenta, glow, rainbow aura — as palette energy, not literal IP)
   - space/void (wormhole, tunnel, expansion, abyss)
   - somatic (pulse, melt, breath-coupled motion) → low-rate modulation only
   - nature (organic flow, bloom, veil)
   - machine/circuit (high-frequency lattice, recursive architecture)
   - time (looping phase, slow eternal drift)
3. Scores valence proxy from keywords (positive-only filter default).
4. Emits `experience_catalog.v1.json` entries:

```json
{
  "id": "exp_lsd_floral_geometry_001",
  "schema_version": "1.0.0",
  "substance": "lsd",
  "valence": "positive",
  "authority": {
    "motifs": "INFERRED",
    "parameters": "INFERRED",
    "source_existence": "OBSERVED"
  },
  "source_refs": [
    {"source": "erowid", "id_hash": "sha256:...", "title_hash": "sha256:...", "url_host": "erowid.org"}
  ],
  "motifs": {
    "geometry": 0.82,
    "color_light": 0.9,
    "space_void": 0.35,
    "entities": 0.2,
    "nature": 0.55,
    "machines": 0.1,
    "somatic": 0.4,
    "time_memory": 0.3
  },
  "narrative_hooks": [
    "floral geometric patterns etched into thick texture",
    "colors become emotionally salient",
    "closed-eye fractals / dancing structure"
  ],
  "visual_recipe": {
    "primary_engines": ["recursive_feedback", "kaleidoscope"],
    "secondary_engines": ["organic_bloom"],
    "mode_default": "attractor",
    "palette": {
      "tracers": "#3EE7F2",
      "energy": 0.9,
      "contrast": 0.7
    },
    "parameter_bias": {
      "symmetry_order": 0.85,
      "feedback_strength": 0.72,
      "recursion_gain": 0.65,
      "turbulence": 0.35,
      "trail_length": 0.8,
      "edge_gain": 0.7,
      "zoom_velocity": 0.15,
      "displacement": 0.25,
      "stability": 0.55,
      "entropy": 0.4
    },
    "phase_profile": {
      "comeup": {"duration_norm": 0.15, "intensity": 0.35},
      "peak": {"duration_norm": 0.45, "intensity": 1.0},
      "plateau": {"duration_norm": 0.25, "intensity": 0.75},
      "comedown": {"duration_norm": 0.15, "intensity": 0.3}
    }
  },
  "safety": {
    "max_flash_hz": 2.0,
    "max_luminance_delta": 0.35,
    "reduced_motion_compatible": true
  }
}
```

### Step B — Substance overlays
Merge catalog statistics with existing `substance_presets.json` `visual_signature` into `substance_visual_overlays.v1.json`:

- LSD → geometric, high symmetry, cyan tracers, pattern complexity, floral lattice CEVs/OEVs
- Psilocybin → organic bloom, softer edges, purple/violet bias, veil/oneness drift, breathing fractal
- DMT → extreme fractal recursion, hyper-saturation, chrysanthemum/tunnel entry, lattice “presence”, fast phase
- 5-MeO-DMT → minimal pattern, white/void luminance, ego-dissolution as field dissolve (not figurative), low complexity high depth
- Mescaline → warm geometric, golden palette, ornamental clarity
- Ketamine → smooth dissociative corridors, depth warping, reduced chromatic chaos
- Baseline → near-identity passthrough / subtle field

### Step C — Parameter mapper
`parameter_mapper.py` produces immutable `PsyFiParameterFieldV1` snapshots:

```text
base_preset.psyfi_params
  + substance.visual_signature
  + experience.visual_recipe.parameter_bias
  + mode_bias(Open|Attractor|Void|Power)
  + user.intensity
  + optional live modulators (time, touch, pointer, mic energy if permitted)
  + safety clamps
  + performance quality tier
→ ParameterField snapshot (frozen)
```

Must be pure and unit-tested.

---

## Visualization engines (browser)

Implement a small **render graph** with pluggable engines. Start with WebGL1/WebGL2 (or Canvas2D fallback). WebGPU optional later.

### Required engines
1. **recursiveFeedback** — camera-or-noise-driven feedback loop, trail, mild zoom/rotate (LSD/DMT core)
2. **kaleidoscope** — symmetry_order driven mirror folds (Attractor)
3. **flowField** — curl noise / optical-flow-like advection (motion, organic)
4. **organicBloom** — soft domain-warped FBM, breathing scale (psilocybin)
5. **voidExpansion** — negative space grow, inversion, sparse stars/veils (Void / 5-MeO)
6. **entityLattice** — abstract non-figurative high-frequency lattice / hyperdimensional architecture (DMT presence without characters)
7. **neutralView** — immediate near-passthrough / stabilized low-effect view

### Render graph order (suggested)
```text
Source (noise field OR optional camera texture OR simulation field texture)
  → ColorConvert
  → PrimaryEngine(s) layered by recipe weights
  → FeedbackHistory
  → PaletteMap (substance palette + energy)
  → OptionalSymbolOverlay (OFF by default; stub only)
  → ToneMap
  → SafetyPass (mandatory)
  → Composite to canvas
  → UI chrome
```

### Simulation field bridge
Also support rendering from Python simulation output:
- API returns normalized field channels (magnitude/phase or multi-channel arrays) as JSON or binary-friendly structure for small grids
- Browser maps field → texture → palette
- For large grids, downsample server-side

Keep both paths:
- **A. Phenomenology Experience Player** (recipes + local/WebGL, can run without heavy sim)
- **B. Core Simulation Visualizer** (Python field → texture)

---

## UI / product surface

Extend the existing dark UI (do not throw away) with a **Live Experience** workspace:

### Controls (quiet, high-contrast)
Always available:
- Emergency Neutral View
- Intensity
- Stop / pause
- Mode: Open | Attractor | Void | Power

Contextual:
- Substance preset
- Experience recipe browser (from catalog)
- Seed display + regenerate
- Phase timeline (comeup/peak/plateau/comedown)
- Safety toggles reflecting `prefers-reduced-motion` and a “Dim flashing” control

Secondary:
- Provenance panel (recipe id, source_ref hashes, authority labels, parameter hash)
- Export parameter timeline / screenshot of viewport (no claim of clinical meaning)

### Accessibility / safety (required)
- Respect `prefers-reduced-motion` → minimize recursive zoom, disable z-axis thrash, crossfade transitions, reduce peripheral flow
- Flash rate clamp ≤ 3 Hz (defaults ≤ 2 Hz)
- Luminance delta limiter in final pass
- No color-only mode distinction (glyphs + labels)
- Textual summary of current experience state
- Keyboard access for primary controls

### Copy rules
Use instrument language:
- “Field stabilized.”
- “Attractor bias active.”
- “Intensity reduced.”
- “Interpretation is speculative.”

Avoid:
- “Healing your trauma”
- “Diagnosing your psyche”
- “Quantum intention collapsed the wavefunction”

---

## API additions (versioned)

Prefer `/api/v1/...` for new routes; keep legacy `/simulate/` working.

Suggested endpoints:
- `GET /api/v1/experiences` — list catalog (filter substance, valence, mode)
- `GET /api/v1/experiences/{id}` — recipe detail
- `POST /api/v1/experiences/build-catalog` — dev/operator only, rebuild from data/
- `POST /api/v1/visualize/parameter-timeline` — body: substance, experience_id, mode, intensity, seed, duration → snapshots + hash
- `POST /api/v1/visualize/field-frame` — optional: run lightweight core steps and return visualizable channels
- `GET /api/v1/substances` — expose presets + visual overlays

All responses include `schema_version`, `engine_version`, `seed`, `provenance`.

---

## Mapping guide from scraped motifs → engines (implement this table)

| Motif cluster (from data) | Engines | Parameter lean | Mode lean |
|---------------------------|---------|----------------|-----------|
| Floral geometric / Fleur-de-lis / etched patterns (LSD) | kaleidoscope + recursiveFeedback | high symmetry_order, edge_gain, trail_length | Attractor |
| Color love / LED / aura / opalescent rainbow (LSD) | recursiveFeedback + palette energy | color_enhancement, palette_energy | Open/Attractor |
| Soft world / speech-bubble glow / melting edges (LSD) | organicBloom + recursiveFeedback | displacement mid, turbulence mid | Open |
| CEVs dancing fractals / veil / oneness (psilocybin) | organicBloom + voidExpansion(low) | soft recursion, breathing zoom | Open/Void |
| Synesthesia color-emotion (psilocybin) | paletteMap driven by slow phase | hue rotation slow, saturation_gain | Open |
| Wormhole / breakthrough / machine lattice (DMT) | entityLattice + recursiveFeedback | max recursion, complexity, depth | Power/Attractor |
| Beautiful chaos → ecstasy/peace (DMT positive) | entityLattice → stabilize to attractor | entropy high then stability rise across phases | Power → Attractor |
| Whiteout / minimal form / pure depth (5-MeO) | voidExpansion + neutral-leaning bloom | low pattern_complexity, high depth, high luminance soft | Void |
| Faces in plants / object confusion (PCP visual) | optional low-weight pareidolia noise (abstract) | edge_gain, low stability | Open (experimental, intensity-capped) |
| Smooth corridors / detachment (ketamine) | flowField + voidExpansion | smooth turbulence, depth_distortion, low chroma chaos | Void |

**Important:** “entities” must render as **abstract lattice/presence fields**, never copyrighted creature designs or literal sacred figures.

---

## Seeded experience library (ship these recipes)

Create at least **12–20** catalog entries, with ~3–5 per primary substance where data supports:

### LSD
1. Floral Geometric Lattice  
2. Color Salience / Aura Field  
3. Physics-Edge Cosmic Geometry  
4. Soft Room Glow + Pattern Crawl  

### Psilocybin
5. Veil Fractals (CEV)  
6. Organic Breath Bloom  
7. Synesthetic Palette Drift  

### DMT
8. Chrysanthemum / Tunnel Entry  
9. Hyperdimensional Lattice Presence  
10. Breakthrough Stabilization (chaos → peace)  

### 5-MeO-DMT
11. Luminous Void Dissolve  

### Mescaline
12. Golden Ornamental Clarity  

### Ketamine
13. Smooth Dissociative Corridor  

### Cross-mode variants
14–20. Same bases × Attractor/Void/Power biases as explicit recipe variants or mode overlays

Each recipe needs deterministic thumbnail generation inputs (fixed seed + fixed noise fixture), not hand-painted unreproducible art.

---

## Implementation sequence (execute in order)

1. **Read** `README.md`, `PLANS.md`, `docs/WEB_ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `psyfi_core/presets/substance_presets.json`, current `psyfi_api` UI/API.
2. **Copy/curate** phenomenology JSON into `data/phenomenology/` (or document path if external).
3. **Schemas** for ExperienceRecipe, ParameterField, VisualFrame.
4. **Catalog builder** + commit derived `experience_catalog.v1.json` (no raw copyrighted full texts in repo if avoidable).
5. **Parameter mapper** + unit tests (determinism hashes).
6. **API routes** for experiences + parameter timeline.
7. **WebGL/Canvas render graph** + engines + safety pass.
8. **UI workspace** integration (substance, recipe, mode, intensity, neutral view, provenance).
9. **Bridge** optional simulation field visualization from existing `/simulate/` metrics/field if available; if field arrays are not yet exposed, add a bounded endpoint.
10. **Safety + a11y** pass (`prefers-reduced-motion`, flash clamp, contrast).
11. **Docs** + engineering receipt + screenshots/fixtures notes.
12. **Run tests**; fix failures; ensure `python test_startup.py` still passes.

---

## Acceptance criteria

```yaml
acceptance:
  catalog_built_from_scraped_data: true
  recipes_count_min: 12
  substances_covered: [lsd, psilocybin, dmt, 5-meo-dmt, mescaline, ketamine]
  modes_implemented: [open, attractor, void, power]
  parameter_field_immutable_per_frame: true
  deterministic_timeline_hash_tests: pass
  webgl_or_canvas_live_viewport: true
  safety_pass_non_bypassable: true
  neutral_view_control: true
  reduce_motion_respected: true
  default_flash_lt_3hz: true
  no_medical_claims_in_ui_copy: true
  legacy_simulate_route_works: true
  provenance_panel_shows_authority_labels: true
  docs_written:
    - docs/VISUAL_EXPERIENCES.md
    - docs/PHENOMENOLOGY_PIPELINE.md
    - docs/ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md
```

---

## Engineering receipt format (produce at end)

Write `docs/ENGINEERING_RECEIPT_VISUAL_EXPERIENCES.md` with:
- files added/changed
- how scraped data was transformed (counts per substance)
- schema versions
- how to run locally
- test commands + results
- known limitations (no device camera Metal path yet, etc.)
- explicit non-claims (not medical; not quantum-intention)
- next steps toward optional camera/sensor adapters and iOS Metal port

---

## Local run checklist (must work)

```bash
# catalog (if scripted)
python scripts/build_experience_catalog.py

# tests
pytest tests/test_experience_catalog.py tests/test_parameter_mapper_determinism.py -q
python test_startup.py

# dev server
python scripts/run_dev_server.py
# open http://localhost:8000
# select substance + experience + mode, confirm live field + neutral view + provenance
```

---

## Notion canon references (behavior authority)

Treat these as behavioral truth when repo docs are thinner:
- PsyFi v2.0 Quantum-Seeded Sensor-Fractal Engineering Baseline
- PsyFi v2.1 Engine Architecture & Runtime Efficiency (parameter field sole authority)
- PsyFi v2.1 Performance / Thermal / Rendering Standards
- PsyFi v2.1 Sensor Fusion Mapping & Replay
- PsyFi v2.2 / v2.3 Brand, Design System, Motion & Visual Safety, Asset Pipeline
- PLANS.md: web application → PWA → native iPhone later

**Priority if conflict:** newest Notion visual/safety standard for UI/motion safety; PLANS.md for web-first delivery; existing Python core for simulation determinism.

---

## Definition of done

A user can open the PsyFi web app, pick **LSD / Psilocybin / DMT / …**, pick a **positive experience recipe** derived from the scraped phenomenology catalog, choose **Open/Attractor/Void/Power**, set **intensity**, watch a **distinct live visual field** that is obviously different per substance/recipe, hit **Neutral View** immediately, inspect **provenance**, and replay the same **seed** to get the same parameter timeline hash — all without medical claims and with safety clamps on.

Begin by inspecting the repo and data paths, then implement in the sequence above. Do not stop at scaffolding.
