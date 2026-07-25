# Phenomenology data

| Path | Purpose |
|------|---------|
| `positive/` | Curated positive/source JSON used to derive recipes |
| `derived/experience_catalog.v1.json` | Ship-ready experience recipes (committed) |
| `derived/substance_visual_overlays.v1.json` | Per-substance palettes, engines, phase profiles |
| `derived/motif_lexicon.v1.json` | Motif channel means + sample hooks |

The builder also reads `psyfi_core/presets/substance_presets.json` for `state_phases` (duration norms) and `emotional_signature` (soft parameter bias only — INFERRED, not medical).

Rebuild + refresh freeze goldens:

```bash
python3 scripts/build_experience_catalog.py
python3 scripts/regenerate_overlay_goldens.py
python3 scripts/sync_frozen_contracts.py
```

See `docs/PHENOMENOLOGY_PIPELINE.md`. Full third-party reports are research inputs; the product UI uses derived motifs and hashed refs only.
