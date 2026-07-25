# Engineering Receipt — Visual Experiences from Scraped Phenomenology

**Date:** 2026-07-24  
**Scope:** Phase 2 visualization runtime (web-first)  
**Status:** Vertical slice complete; device camera/Metal deferred

## Delivered

### Data
- `data/phenomenology/positive/` — 20 curated positive/source JSON files
- `data/phenomenology/derived/experience_catalog.v1.json` — **33 recipes**
  - lsd 12, psilocybin 8, dmt 8, 5-meo-dmt 1, mescaline 1, ketamine 1, pcp 2
- `data/phenomenology/derived/substance_visual_overlays.v1.json`

### Core
- `psyfi_core/experiences/` — catalog + parameter_mapper
- `scripts/build_experience_catalog.py`
- `docs/schemas/psyfi_experience_recipe.v1.json`
- `docs/schemas/psyfi_parameter_field.v1.json`

### API
- `psyfi_api/routers/experiences.py` mounted at `/api/v1/*`
- Legacy `/simulate/` unchanged

### Frontend
- `psyfi_api/static/viz/experiencePlayer.js` — multi-engine Canvas field + safety pass
- Live Experience panel in `templates/index.html` + `app.js` + CSS

### Tests
```text
pytest tests/test_experiences.py
9 passed
```

### Docs
- `docs/VISUAL_EXPERIENCES.md`
- `docs/PHENOMENOLOGY_PIPELINE.md`
- `docs/CURSOR_PROMPT_VISUAL_EXPERIENCES_FROM_SCRAPED_DATA.md`

## Non-claims

- Not medical, diagnostic, or therapeutic
- Not asserting intention-altered quantum processes
- Parameters/motifs labeled INFERRED; source presence OBSERVED

## Known limitations

- Renderer is Canvas (CPU fbm), low internal resolution upscaled — not WebGL/Metal yet
- No live camera/sensor adapters in this slice
- `test_startup.py` route introspection fails on newer Starlette router objects (pre-existing style check)
- PCP recipes intensity-capped; treated experimental

## Next

1. WebGL shader port of the same parameter field
2. Optional getUserMedia camera texture input
3. Device motion → parameter_mapper live modulators
4. iOS Metal adapters against the same schemas after web validation
