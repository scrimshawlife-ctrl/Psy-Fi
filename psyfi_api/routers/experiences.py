"""Experience catalog and visualization parameter timeline APIs."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from psyfi_api.simulation_service import PresetNotFoundError, run_simulation
from psyfi_core.experiences.catalog import get_default_catalog, load_catalog
from psyfi_core.experiences.parameter_mapper import (
    MODE_BIASES,
    SUBSTANCE_VISUAL_DEFAULTS,
    build_parameter_timeline,
    map_parameters,
)
from psyfi_core.visualization.scene_snapshot import build_scene_snapshot

router = APIRouter(prefix="/api/v1", tags=["experiences"])

ModeName = Literal["open", "attractor", "void", "power"]


class Modulators(BaseModel):
    """Optional progressive enhancers routed only through ParameterField."""

    camera: float = Field(default=0.0, ge=0.0, le=1.0)
    motion: float = Field(default=0.0, ge=0.0, le=1.0)
    midi: float = Field(default=0.0, ge=0.0, le=1.0)


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
    modulators: Modulators | None = None


class FieldFrameRequest(BaseModel):
    """Bridge: run a bounded Python simulation and return visualizable channels."""

    width: int = Field(default=32, ge=8, le=128)
    height: int = Field(default=32, ge=8, le=128)
    steps: int = Field(default=4, ge=1, le=64)
    seed: int = Field(default=42, ge=0)
    preset: str | None = None
    substance: str | None = None
    mode: ModeName = "open"
    intensity: float = Field(default=0.7, ge=0.0, le=1.0)


class SceneSnapshotRequest(BaseModel):
    """Immutable GPU scene snapshot — analysis publish surface for the WebGPU client."""

    substance: str = "lsd"
    experience_id: str | None = None
    mode: ModeName = "open"
    intensity: float = Field(default=0.7, ge=0.0, le=1.0)
    seed: int = Field(default=42, ge=0)
    steps: int = Field(default=12, ge=2, le=128)
    quality_tier: str = "balanced"
    reduce_motion: bool = False
    dim_flashing: bool = False
    neutral_view: bool = False
    sequence: int = Field(default=1, ge=1)
    include_simulation: bool = True
    width: int = Field(default=32, ge=8, le=128)
    height: int = Field(default=32, ge=8, le=128)
    sim_steps: int = Field(default=4, ge=1, le=64)
    modulators: Modulators | None = None


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
    items = []
    for substance_id in substances:
        overlay = catalog.overlay(substance_id) or {}
        signature = {
            **SUBSTANCE_VISUAL_DEFAULTS.get(substance_id, {}),
            **(overlay.get("visual_signature") or {}),
        }
        items.append(
            {
                "id": substance_id,
                "visual_signature": signature,
                "overlay": overlay or None,
                "recommended_mode": overlay.get("recommended_mode") or "open",
                "recipe_count": len(catalog.list(substance=substance_id, valence=None)),
                "authority": overlay.get("authority")
                or {
                    "motifs": "INFERRED",
                    "parameters": "INFERRED",
                    "source_existence": "OBSERVED",
                },
            }
        )
    return {
        "schema_version": "1.0.0",
        "substances": items,
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
        if not body.substance or body.substance == "lsd":
            # prefer recipe substance when client left default-ish
            substance = experience.get("substance") or body.substance
        else:
            substance = body.substance
    else:
        substance = body.substance

    overlay = catalog.overlay(substance) or {}
    cap = float(
        (experience or {}).get("safety", {}).get("intensity_cap")
        or overlay.get("safety", {}).get("intensity_cap")
        or 1.0
    )
    intensity = min(body.intensity, cap)
    modulators = body.modulators.model_dump() if body.modulators else None

    if body.phase_t is not None:
        snap = map_parameters(
            substance=substance,
            mode=body.mode,
            intensity=intensity,
            seed=body.seed,
            experience=experience,
            modulators=modulators,
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
        modulators=modulators,
        reduce_motion=body.reduce_motion,
        dim_flashing=body.dim_flashing,
        quality_tier=body.quality_tier,
    )
    timeline["kind"] = "timeline"
    return timeline


@router.post("/visualize/field-frame")
async def field_frame(body: FieldFrameRequest) -> dict[str, Any]:
    """Run a bounded simulation and pair it with a ParameterField snapshot."""
    substance = (body.substance or body.preset or "lsd").lower().replace("_", "-")
    try:
        sim = run_simulation(
            width=body.width,
            height=body.height,
            steps=body.steps,
            seed=body.seed,
            preset=body.preset or (substance if substance != "baseline" else None),
        )
    except PresetNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    snap = map_parameters(
        substance=substance,
        mode=body.mode,
        intensity=body.intensity,
        seed=body.seed,
        phase_t=0.5,
    )
    return {
        "schema_version": "1.0.0",
        "kind": "field_frame",
        "seed": body.seed,
        "substance": substance,
        "simulation": {
            "width": sim.get("width"),
            "height": sim.get("height"),
            "metrics": {
                "valence": sim.get("valence"),
                "coherence": sim.get("coherence"),
                "symmetry": sim.get("symmetry"),
                "roughness": sim.get("roughness"),
                "richness": sim.get("richness"),
            },
            "visualization": sim.get("visualization"),
            "provenance_id": sim.get("provenance_id"),
            "api_version": sim.get("api_version"),
        },
        "parameter_field": snap.to_dict(),
        "note": (
            "Simulation field is authoritative for metrics; "
            "ParameterField is authoritative for Live Experience rendering."
        ),
    }


@router.post("/visualize/scene-snapshot")
async def scene_snapshot(body: SceneSnapshotRequest) -> dict[str, Any]:
    """Publish an immutable GPU scene snapshot (analysis → renderer contract)."""
    substance = body.substance.lower().replace("_", "-")
    catalog = get_default_catalog()
    experience = catalog.get(body.experience_id) if body.experience_id else None
    modulators = body.modulators.model_dump() if body.modulators else None
    timeline = build_parameter_timeline(
        substance=substance,
        mode=body.mode,
        intensity=body.intensity,
        seed=body.seed,
        steps=body.steps,
        experience=experience,
        modulators=modulators,
        reduce_motion=body.reduce_motion,
        dim_flashing=body.dim_flashing,
        quality_tier=body.quality_tier,
    )
    frames = timeline.get("frames") or []
    if frames:
        parameter_field = dict(frames[len(frames) // 2])
    else:
        parameter_field = map_parameters(
            substance=substance,
            mode=body.mode,
            intensity=body.intensity,
            seed=body.seed,
            phase_t=0.5,
            experience=experience,
            modulators=modulators,
            reduce_motion=body.reduce_motion,
            dim_flashing=body.dim_flashing,
            quality_tier=body.quality_tier,
            neutral_view=body.neutral_view,
        ).to_dict()
    if body.neutral_view:
        parameter_field = dict(parameter_field)
        parameter_field["neutral_view"] = True

    simulation = None
    if body.include_simulation:
        try:
            sim = run_simulation(
                width=body.width,
                height=body.height,
                steps=body.sim_steps,
                seed=body.seed,
                preset=substance if substance != "baseline" else None,
            )
        except PresetNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        simulation = {
            "width": sim.get("width"),
            "height": sim.get("height"),
            "metrics": {
                "valence": sim.get("valence"),
                "coherence": sim.get("coherence"),
                "symmetry": sim.get("symmetry"),
                "roughness": sim.get("roughness"),
                "richness": sim.get("richness"),
            },
            "visualization": sim.get("visualization"),
            "provenance_id": sim.get("provenance_id"),
            "api_version": sim.get("api_version"),
        }

    snap = build_scene_snapshot(
        parameter_field=parameter_field,
        simulation=simulation,
        quality_tier=body.quality_tier,
        sequence=body.sequence,
    )
    snap["kind"] = "scene_snapshot"
    snap["substance"] = substance
    snap["experience_id"] = body.experience_id
    snap["timeline_hash"] = timeline.get("timeline_hash")
    return snap


@router.post("/experiences/reload-catalog")
async def reload_catalog() -> dict[str, Any]:
    """Reload catalog from disk (dev helper)."""
    from psyfi_core.experiences import catalog as catalog_mod

    catalog_mod.get_default_catalog.cache_clear()
    c = catalog_mod.get_default_catalog()
    return {
        "status": "reloaded",
        "recipe_count": len(c.recipes),
        "path": str(c.path) if c.path else None,
    }
