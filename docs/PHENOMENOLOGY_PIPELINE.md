# Phenomenology Pipeline

```text
positive JSON reports (Erowid/X/Reddit curated)
        ↓
scripts/build_experience_catalog.py
        ↓
motif scores + valence filter + engine suggestions
        ↓
experience_catalog.v1.json
        ↓
aggregate per substance → substance_visual_overlays.v1.json
  (visual_signature, engine_weights, parameter_bias, palette, phase, safety)
        ↓
parameter_mapper.map_parameters / build_parameter_timeline
        ↓
API (/api/v1/substances, /api/v1/visualize/...) + Canvas ExperiencePlayer
```

## Rebuild catalog

```bash
python scripts/build_experience_catalog.py
```

Also writes `psyfi_core/experiences/builtin_catalog.v1.json` as import fallback.

## Motif channels

geometry, entities, color_light, space_void, body_somatic, time_memory, nature, machines

## Legal / product notes

- Do not bulk-republish full third-party trip reports in the product UI.
- Catalog stores hashes + short derived hooks.
- Erowid scraping requires their written permission for ongoing collection; this pack is a local research artifact.
