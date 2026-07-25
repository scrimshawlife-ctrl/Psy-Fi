# Phenomenology data

| Path | Purpose |
|------|---------|
| `positive/` | Curated positive/source JSON used to derive recipes |
| `derived/experience_catalog.v1.json` | Ship-ready experience recipes (committed) |
| `derived/substance_visual_overlays.v1.json` | Aggregate motif overlays |

Rebuild:

```bash
python scripts/build_experience_catalog.py
```

See `docs/PHENOMENOLOGY_PIPELINE.md`. Full third-party reports are research inputs; the product UI uses derived motifs and hashed refs only.
