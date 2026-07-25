"""Simulation endpoint for consciousness field evolution."""

from __future__ import annotations

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from psyfi_core import PsyFiConfig, ABXRuntime
from psyfi_core.models import ResonanceFrame
from psyfi_core.models.session import (
    SESSION_SCHEMA_VERSION,
    PsyFiSession,
    PsyFiVisualization,
    SessionMetrics,
)
from psyfi_core.models.substance_preset import load_preset
from psyfi_core.visualization import build_magnitude_visualization
from psyfi_core.engines import (
    ConsciousnessOmegaParams,
    evolve_consciousness_omega,
    NormalizationParams,
    apply_normalization,
    compute_valence_metrics,
)

router = APIRouter(prefix="/simulate", tags=["simulation"])


class SimulateRequest(BaseModel):
    """Request for consciousness field simulation."""

    width: int = Field(default=64, ge=8, le=512)
    height: int = Field(default=64, ge=8, le=512)
    steps: int = Field(default=10, ge=1, le=1000)
    seed: int | None = Field(default=None, ge=0, le=2**32 - 1)
    preset: str | None = Field(
        default=None,
        description="Optional substance preset id/alias influencing coupling and normalization.",
    )


class SimulateResponse(BaseModel):
    """Response from consciousness field simulation.

    Existing metric fields remain stable. Contract metadata and visualization
    are additive for web-shell consumers.
    """

    width: int
    height: int
    valence: float
    coherence: float
    symmetry: float
    roughness: float
    richness: float
    schema_version: str = SESSION_SCHEMA_VERSION
    engine_version: str = "0.1.0"
    api_version: str = "v0"
    seed: int
    provenance_id: str
    module_chain: list[str]
    preset: str | None = None
    session: PsyFiSession
    visualization: PsyFiVisualization


@router.post("/", response_model=SimulateResponse)
async def simulate_consciousness_field(request: SimulateRequest) -> SimulateResponse:
    """Simulate consciousness field evolution."""
    config = PsyFiConfig()
    config.validate_grid_size(request.width, request.height)

    seed = config.abx.default_seed if request.seed is None else request.seed
    runtime = ABXRuntime(deterministic=True, seed=seed)
    runtime.metrics.set_grid_size(request.width, request.height)

    coupling_strength = 0.5
    normalization_P = 1.0
    normalization_V = 1.0
    preset_name: str | None = None

    if request.preset:
        preset = load_preset(request.preset)
        if preset is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail=f"Preset '{request.preset}' not found")
        preset_name = preset.name
        coupling_strength = float(preset.psyfi_params.coupling_strength)
        normalization_P = float(preset.psyfi_params.normalization.P)
        normalization_V = float(preset.psyfi_params.normalization.V)
        runtime.provenance.add_meta("preset", request.preset)

    frame = ResonanceFrame.zeros(request.width, request.height)
    random_phases = runtime.rng.uniform(
        -np.pi, np.pi, size=(request.height, request.width)
    )
    initial_magnitudes = runtime.rng.uniform(0.5, 1.5, size=(request.height, request.width))
    initial_field = (initial_magnitudes * np.exp(1j * random_phases)).astype(np.complex64)
    frame = frame.copy_with_field(initial_field)

    params = ConsciousnessOmegaParams(
        coupling_type="symmetric",
        coupling_strength=coupling_strength,
        steps=request.steps,
        dt=0.1,
    )
    evolved_field = evolve_consciousness_omega(frame.field, params, runtime)

    norm_params = NormalizationParams(
        P=normalization_P, V=normalization_V, surround_radius=3
    )
    normalized_field = apply_normalization(evolved_field, norm_params)
    valence_metrics = compute_valence_metrics(normalized_field)

    for module_name in ("normalization_nu", "valence_kappa"):
        if module_name not in runtime.provenance.module_chain:
            runtime.provenance.add_module(module_name)
    runtime.provenance.add_parameter("width", request.width)
    runtime.provenance.add_parameter("height", request.height)
    runtime.provenance.add_parameter("steps", request.steps)
    runtime.provenance.add_parameter("seed", seed)
    if request.preset:
        runtime.provenance.add_parameter("preset", request.preset)

    metrics = SessionMetrics(
        valence=valence_metrics.valence_score,
        coherence=valence_metrics.coherence_score,
        symmetry=valence_metrics.symmetry_score,
        roughness=valence_metrics.roughness_score,
        richness=valence_metrics.richness_score,
    )
    session = PsyFiSession.from_simulation(
        seed=seed,
        width=request.width,
        height=request.height,
        steps=request.steps,
        metrics=metrics,
        module_chain=list(runtime.provenance.module_chain),
        provenance_parameters=dict(runtime.provenance.parameters),
        provenance_meta=dict(runtime.provenance.meta),
        coupling_strength=params.coupling_strength,
        normalization_P=norm_params.P,
        normalization_V=norm_params.V,
    )
    if preset_name:
        session.preset = request.preset

    visualization = build_magnitude_visualization(
        normalized_field,
        session.provenance.id,
        max_dim=64,
        valence=metrics.valence,
        coherence=metrics.coherence,
    )
    session.result.visualization_ref = visualization.schema_version

    return SimulateResponse(
        width=request.width,
        height=request.height,
        valence=metrics.valence,
        coherence=metrics.coherence,
        symmetry=metrics.symmetry,
        roughness=metrics.roughness,
        richness=metrics.richness,
        seed=seed,
        provenance_id=session.provenance.id,
        module_chain=session.provenance.module_chain,
        preset=request.preset,
        session=session,
        visualization=visualization,
    )
