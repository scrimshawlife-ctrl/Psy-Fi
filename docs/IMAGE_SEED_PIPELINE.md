# Image Seed Pipeline (two-pass)

Status: **active** — Pass 1 experience conditioner + Pass 2 live ParameterField  
Related: [`VISUAL_EXPERIENCES.md`](VISUAL_EXPERIENCES.md), [`rendering/ASSET_STANDARDS.md`](rendering/ASSET_STANDARDS.md), [`CONTINUATION_PLAN.md`](CONTINUATION_PLAN.md)

## Goal

User provides an image. Experience recipe data **first** conditions that image (Pass 1). Live render then modulates the resulting seed through ParameterField + SafetyPass (Pass 2).

```
User image (ephemeral)
    → Pass 1: experience conditioner (recipe params reshape pixels + features)
    → derived master_seed + image_hints + conditioned luminance plane
    → Pass 2: map_parameters + live modulators (incl. modulators.image)
    → Canvas/WebGL / optional /gpu/ scene-snapshot (SafetyPass mandatory)
```

## Authority

| Layer | Authority |
| --- | --- |
| ParameterField | Visual source of truth (unchanged) |
| Experience recipe | Pass-1 seed modulator (not a second field) |
| Conditioned image / luminance plane | Optional source-plane blend only |
| SafetyPass / Neutral / intensity caps | Non-bypassable |

Raw uploads are never stored and never embedded in scene-snapshots.

## Pass 1 — Experience conditioner

Module: `psyfi_core/visualization/image_seed.py`

1. Decode PNG/JPEG → RGBA, downscale (max edge 384).
2. Measure features (mean RGB, contrast, edge density, warm/cool, energy).
3. Apply recipe/overlay biases as pixel ops (saturation, void crush, symmetry fold, mild turbulence) scaled by `influence`.
4. Derive `master_seed` from SHA-256 of conditioned bytes.
5. Emit capped `parameter_hints` for live mapping.
6. Emit luminance `source_field` for Live Experience source-plane blend.
7. Optional small PNG preview (base64) for UI — discard after response.

## Pass 2 — Live render

- Client writes `seedInput` from Pass 1.
- `modulators.image` ∈ [0,1] = influence strength into `map_parameters`.
- Conditioned luminance → `setSourcePlane` (same path as sim source plane).
- Timeline / field-frame / scene-snapshot proceed as today.

## API (additive)

`POST /api/v1/visualize/image-seed`

- Multipart: `file` + form fields (`substance`, `experience_id`, `mode`, `intensity`, `influence`, …)
- Or JSON: `{ "image_base64": "...", ... }`
- Response schema: `psyfi.image_seed.v1`

## Non-claims

Modeled phenomenology for research/visualization only. Not medical advice.
