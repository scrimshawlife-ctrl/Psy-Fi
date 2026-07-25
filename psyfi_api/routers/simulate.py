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
    SessionMetrics,
)
from psyfi_core.engines import (
    ConsciousnessOmegaParams,
    evolve_consciousness_omega,
    NormalizationParams,
    apply_normalization,
    compute_valence_metrics,
)

router = APIRouter(prefix="/simulate", tags=["simulation"])


class SimulateRequest(BaseModel):
    """Request for consciousness field simulation.

    Attributes:
        width: Width of the field
        height: Height of the field
        steps: Number of evolution steps
        seed: Optional deterministic seed override
    """

    width: int = Field(default=64, ge=8, le=512)
    height: int = Field(default=64, ge=8, le=512)
    steps: int = Field(default=10, ge=1, le=1000)
    seed: int | None = Field(default=None, ge=0, le=2**32 - 1)


class SimulateResponse(BaseModel):
    """Response from consciousness field simulation.

    Existing metric fields remain stable. Contract metadata is additive so
    current clients keep working while Phase 0 session serialization lands.
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
    session: PsyFiSession


@router.post("/", response_model=SimulateResponse)
async def simulate_consciousness_field(request: SimulateRequest) -> SimulateResponse:
    """Simulate consciousness field evolution.

    Creates a random initial field, evolves it using Consciousness Omega,
    applies normalization, and computes valence metrics.
    """
    config = PsyFiConfig()
    config.validate_grid_size(request.width, request.height)

    seed = config.abx.default_seed if request.seed is None else request.seed
    runtime = ABXRuntime(deterministic=True, seed=seed)
    runtime.metrics.set_grid_size(request.width, request.height)

    frame = ResonanceFrame.zeros(request.width, request.height)

    random_phases = runtime.rng.uniform(
        -np.pi, np.pi, size=(request.height, request.width)
    )
    initial_magnitudes = runtime.rng.uniform(0.5, 1.5, size=(request.height, request.width))
    initial_field = (initial_magnitudes * np.exp(1j * random_phases)).astype(np.complex64)
    frame = frame.copy_with_field(initial_field)

    params = ConsciousnessOmegaParams(
        coupling_type="symmetric",
        coupling_strength=0.5,
        steps=request.steps,
        dt=0.1,
    )
    evolved_field = evolve_consciousness_omega(frame.field, params, runtime)

    norm_params = NormalizationParams(P=1.0, V=1.0, surround_radius=3)
    normalized_field = apply_normalization(evolved_field, norm_params)

    valence_metrics = compute_valence_metrics(normalized_field)

    # Engines that accept runtime already record themselves. Fill gaps for
    # helpers that do not yet take an ABXRuntime (normalization / valence).
    for module_name in ("normalization_nu", "valence_kappa"):
        if module_name not in runtime.provenance.module_chain:
            runtime.provenance.add_module(module_name)
    runtime.provenance.add_parameter("width", request.width)
    runtime.provenance.add_parameter("height", request.height)
    runtime.provenance.add_parameter("steps", request.steps)
    runtime.provenance.add_parameter("seed", seed)

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
        session=session,
    )
