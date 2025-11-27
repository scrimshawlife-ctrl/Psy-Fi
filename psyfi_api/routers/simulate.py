"""Simulation endpoint for consciousness field evolution."""

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

from psyfi_core import PsyFiConfig, ABXRuntime
from psyfi_core.models import ResonanceFrame
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
    """

    width: int = Field(default=64, ge=8, le=512)
    height: int = Field(default=64, ge=8, le=512)
    steps: int = Field(default=10, ge=1, le=1000)


class SimulateResponse(BaseModel):
    """Response from consciousness field simulation.

    Attributes:
        width: Width of the field
        height: Height of the field
        valence: Overall valence score
        coherence: Coherence score
        symmetry: Symmetry score
        roughness: Roughness score
        richness: Richness score
    """

    width: int
    height: int
    valence: float
    coherence: float
    symmetry: float
    roughness: float
    richness: float


@router.post("/", response_model=SimulateResponse)
async def simulate_consciousness_field(request: SimulateRequest) -> SimulateResponse:
    """Simulate consciousness field evolution.

    Creates a random initial field, evolves it using Consciousness Omega,
    applies normalization, and computes valence metrics.

    Args:
        request: Simulation parameters

    Returns:
        Simulation results with valence metrics
    """
    # Create configuration
    config = PsyFiConfig()
    config.validate_grid_size(request.width, request.height)

    # Create deterministic runtime
    runtime = ABXRuntime(deterministic=True, seed=config.abx.default_seed)
    runtime.metrics.set_grid_size(request.width, request.height)

    # Create initial resonance frame with zeros
    frame = ResonanceFrame.zeros(request.width, request.height)

    # Initialize field with random phases on the unit circle
    # This creates a field with uniform magnitude but random phases
    random_phases = runtime.rng.uniform(
        -np.pi, np.pi, size=(request.height, request.width)
    )
    initial_magnitudes = runtime.rng.uniform(0.5, 1.5, size=(request.height, request.width))
    initial_field = initial_magnitudes * np.exp(1j * random_phases)
    initial_field = initial_field.astype(np.complex64)

    frame = frame.copy_with_field(initial_field)

    # Evolve the field using Consciousness Omega
    params = ConsciousnessOmegaParams(
        coupling_type="symmetric",
        coupling_strength=0.5,
        steps=request.steps,
        dt=0.1,
    )
    evolved_field = evolve_consciousness_omega(frame.field, params, runtime)

    # Apply normalization
    norm_params = NormalizationParams(P=1.0, V=1.0, surround_radius=3)
    normalized_field = apply_normalization(evolved_field, norm_params)

    # Compute valence metrics
    valence_metrics = compute_valence_metrics(normalized_field)

    return SimulateResponse(
        width=request.width,
        height=request.height,
        valence=valence_metrics.valence_score,
        coherence=valence_metrics.coherence_score,
        symmetry=valence_metrics.symmetry_score,
        roughness=valence_metrics.roughness_score,
        richness=valence_metrics.richness_score,
    )
