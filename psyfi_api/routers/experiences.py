"""Experience catalog and visualization parameter timeline APIs."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from psyfi_core.experiences.catalog import get_default_catalog, load_catalog
from psyfi_core.experiences.parameter_mapper import (
    MODE_BIASES,
    SUBSTANCE_VISUAL_DEFAULTS,
    build_parameter_timeline,
    map_parameters,
)

router = APIRouter(prefix="/api/v1", tags=["experiences"])

ModeName = Literal["open", "attractor", "void", "power"]


class TimelineRequest(BaseModel):
    substance: str = "lsd"
    experience_id: str | None = None
    mode: ModeName = "open"
    intensity: float = Field(default=0.7, ge=0.0, le=1.0)
    seed: int = Field(default=42, ge=0)
    steps: int = Field(default=24, ge=2, le=128)
    reduce_motion: bool = False
    dim_flashing: bool = False
    quality_tier: str = "balanced"
    phase_t: float | None = Field(default=None, ge=0.0, le=1.0)
    neutral_view: bool = False


@router.get("/experiences")
async def list_experiences(
    substance: str | None = None,
    valence: str | None = Query(default="positive"),
    mode: str | None = None,
) -> dict[str, Any]:
    catalog = get_default_catalog()
    recipes = catalog.list(substance=substance, valence=valence, mode=mode)
    # lightweight list payload
    items = [
        {
            "id": r.get("id"),
            "title": r.get("title") or r.get("id"),
            "substance": r.get("substance"),
            "valence": r.get("valence"),
            "mode_default": (r.get("visual_recipe") or {}).get("mode_default", "open"),
            "primary_engines": (r.get("visual_recipe") or {}).get("primary_engines", []),
            "motifs": r.get("motifs", {}),
            "authority": r.get("authority", {}),
        }
        for r in recipes
    ]
    return {
        "schema_version": catalog.schema_version,
        "count": len(items),
        "items": items,
    }


@router.get("/experiences/{experience_id}")
async def get_experience(experience_id: str) -> dict[str, Any]:
    catalog = get_default_catalog()
    recipe = catalog.get(experience_id)
    if not recipe:
        raise HTTPException(status_code=404, detail=f"Experience not found: {experience_id}")
    return {"schema_version": catalog.schema_version, "recipe": recipe}


@router.get("/substances")
async def list_substances() -> dict[str, Any]:
    catalog = get_default_catalog()
    substances = sorted(set(catalog.substances()) | set(SUBSTANCE_VISUAL_DEFAULTS.keys()))
    return {
        "schema_version": "1.0.0",
        "substances": [
            {
                "id": s,
                "visual_signature": SUBSTANCE_VISUAL_DEFAULTS.get(s, {}),
                "recipe_count": len(catalog.list(substance=s, valence=None)),
            }
            for s in substances
        ],
        "modes": list(MODE_BIASES.keys()),
    }


@router.post("/visualize/parameter-timeline")
async def parameter_timeline(body: TimelineRequest) -> dict[str, Any]:
    catalog = get_default_catalog()
    experience = None
    if body.experience_id:
        experience = catalog.get(body.experience_id)
        if not experience:
            raise HTTPException(status_code=404, detail=f"Experience not found: {body.experience_id}")
        # optional intensity cap from recipe safety
        cap = float((experience.get("safety") or {}).get("intensity_cap", 1.0))
        intensity = min(body.intensity, cap)
        if not body.substance or body.substance == "lsd":
            # prefer recipe substance when client left default-ish
            substance = experience.get("substance") or body.substance
        else:
            substance = body.substance
    else:
        intensity = body.intensity
        substance = body.substance

    if body.phase_t is not None and body.neutral_view:
        snap = map_parameters(
            substance=substance,
            mode=body.mode,
            intensity=intensity,
            seed=body.seed,
            experience=experience,
            phase_t=body.phase_t,
            neutral_view=True,
            reduce_motion=body.reduce_motion,
            dim_flashing=body.dim_flashing,
            quality_tier=body.quality_tier,
        )
        return {
            "schema_version": "1.0.0",
            "kind": "snapshot",
            "frame": snap.to_dict(),
        }

    if body.phase_t is not None:
        snap = map_parameters(
            substance=substance,
            mode=body.mode,
            intensity=intensity,
            seed=body.seed,
            experience=experience,
            phase_t=body.phase_t,
            neutral_view=body.neutral_view,
            reduce_motion=body.reduce_motion,
            dim_flashing=body.dim_flashing,
            quality_tier=body.quality_tier,
        )
        return {
            "schema_version": "1.0.0",
            "kind": "snapshot",
            "frame": snap.to_dict(),
        }

    timeline = build_parameter_timeline(
        steps=body.steps,
        substance=substance,
        mode=body.mode,
        intensity=intensity,
        seed=body.seed,
        experience=experience,
        reduce_motion=body.reduce_motion,
        dim_flashing=body.dim_flashing,
        quality_tier=body.quality_tier,
    )
    timeline["kind"] = "timeline"
    return timeline


@router.post("/experiences/reload-catalog")
async def reload_catalog() -> dict[str, Any]:
    """Reload catalog from disk (dev helper)."""
    get_default_catalog.cache_clear()
    catalog = load_catalog()
    get_default_catalog.cache_clear()
    # repopulate cache
    from psyfi_core.experiences import catalog as catalog_mod

    catalog_mod.get_default_catalog.cache_clear()
    c = catalog_mod.get_default_catalog()
    return {
        "status": "reloaded",
        "recipe_count": len(c.recipes),
        "path": str(c.path) if c.path else None,
    }
