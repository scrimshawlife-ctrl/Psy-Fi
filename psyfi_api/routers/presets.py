"""Preset catalog endpoints backed by the existing substance preset registry."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from psyfi_core.models.substance_preset import get_registry, load_preset

router = APIRouter(prefix="/api/presets", tags=["presets"])


class PresetSummary(BaseModel):
    """Lightweight preset card for the web preset browser."""

    id: str
    name: str
    substance_class: str
    aliases: list[str] = Field(default_factory=list)


class PresetDetail(PresetSummary):
    """Preset detail including portable psyfi parameter defaults."""

    coupling_strength: float
    phase_noise: float
    phase_reset_strength: float
    drift_amplitude: float
    drift_velocity: float
    normalization_P: float
    normalization_V: float


class PresetListResponse(BaseModel):
    """Catalog response for substance presets."""

    count: int
    presets: list[PresetSummary]


@router.get("/", response_model=PresetListResponse)
async def list_substance_presets() -> PresetListResponse:
    """List substance presets from the existing JSON registry."""
    registry = get_registry()
    presets = [
        PresetSummary(
            id=key,
            name=preset.name,
            substance_class=preset.substance_class.value,
            aliases=list(preset.aliases),
        )
        for key, preset in registry.get_all().items()
    ]
    presets.sort(key=lambda item: item.id)
    return PresetListResponse(count=len(presets), presets=presets)


@router.get("/{preset_id}", response_model=PresetDetail)
async def get_substance_preset(preset_id: str) -> PresetDetail:
    """Fetch one preset by id or alias."""
    preset = load_preset(preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")

    params = preset.psyfi_params
    # Resolve canonical id from registry when an alias was used.
    registry = get_registry()
    canonical = preset_id
    for key, value in registry.get_all().items():
        if value.name == preset.name:
            canonical = key
            break

    return PresetDetail(
        id=canonical,
        name=preset.name,
        substance_class=preset.substance_class.value,
        aliases=list(preset.aliases),
        coupling_strength=params.coupling_strength,
        phase_noise=params.phase_noise,
        phase_reset_strength=params.phase_reset_strength,
        drift_amplitude=params.drift_amplitude,
        drift_velocity=params.drift_velocity,
        normalization_P=params.normalization.P,
        normalization_V=params.normalization.V,
    )
