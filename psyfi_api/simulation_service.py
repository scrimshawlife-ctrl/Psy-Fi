"""Shared simulation runner used by sync and job-based API routes."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import numpy as np

from psyfi_core import PsyFiConfig, ABXRuntime
from psyfi_core.abx_core.errors import SimulationCancelled
from psyfi_core.engines import (
    ConsciousnessOmegaParams,
    NormalizationParams,
    apply_normalization,
    compute_valence_metrics,
    evolve_consciousness_omega,
)
from psyfi_core.models import ResonanceFrame
from psyfi_core.models.session import PsyFiSession, SessionMetrics
from psyfi_core.models.substance_preset import load_preset
from psyfi_core.visualization import build_magnitude_visualization


class PresetNotFoundError(ValueError):
    """Raised when a requested substance preset cannot be resolved."""


def run_simulation(
    *,
    width: int,
    height: int,
    steps: int,
    seed: int | None = None,
    preset: str | None = None,
    should_cancel: Callable[[], bool] | None = None,
) -> dict[str, Any]:
    """Execute a deterministic simulation and return a JSON-ready payload."""
    config = PsyFiConfig()
    config.validate_grid_size(width, height)

    effective_seed = config.abx.default_seed if seed is None else seed
    runtime = ABXRuntime(deterministic=True, seed=effective_seed)
    runtime.metrics.set_grid_size(width, height)

    coupling_strength = 0.5
    normalization_P = 1.0
    normalization_V = 1.0

    if preset:
        loaded = load_preset(preset)
        if loaded is None:
            raise PresetNotFoundError(f"Preset '{preset}' not found")
        coupling_strength = float(loaded.psyfi_params.coupling_strength)
        normalization_P = float(loaded.psyfi_params.normalization.P)
        normalization_V = float(loaded.psyfi_params.normalization.V)
        runtime.provenance.add_meta("preset", preset)

    if should_cancel is not None and should_cancel():
        raise SimulationCancelled("Simulation cancelled before start")

    frame = ResonanceFrame.zeros(width, height)
    random_phases = runtime.rng.uniform(-np.pi, np.pi, size=(height, width))
    initial_magnitudes = runtime.rng.uniform(0.5, 1.5, size=(height, width))
    initial_field = (initial_magnitudes * np.exp(1j * random_phases)).astype(np.complex64)
    frame = frame.copy_with_field(initial_field)

    params = ConsciousnessOmegaParams(
        coupling_type="symmetric",
        coupling_strength=coupling_strength,
        steps=steps,
        dt=0.1,
    )
    evolved_field = evolve_consciousness_omega(
        frame.field,
        params,
        runtime,
        should_cancel=should_cancel,
    )

    if should_cancel is not None and should_cancel():
        raise SimulationCancelled("Simulation cancelled after evolution")

    norm_params = NormalizationParams(
        P=normalization_P, V=normalization_V, surround_radius=3
    )
    normalized_field = apply_normalization(evolved_field, norm_params)
    valence_metrics = compute_valence_metrics(normalized_field)

    for module_name in ("normalization_nu", "valence_kappa"):
        if module_name not in runtime.provenance.module_chain:
            runtime.provenance.add_module(module_name)
    runtime.provenance.add_parameter("width", width)
    runtime.provenance.add_parameter("height", height)
    runtime.provenance.add_parameter("steps", steps)
    runtime.provenance.add_parameter("seed", effective_seed)
    if preset:
        runtime.provenance.add_parameter("preset", preset)

    metrics = SessionMetrics(
        valence=valence_metrics.valence_score,
        coherence=valence_metrics.coherence_score,
        symmetry=valence_metrics.symmetry_score,
        roughness=valence_metrics.roughness_score,
        richness=valence_metrics.richness_score,
    )
    session = PsyFiSession.from_simulation(
        seed=effective_seed,
        width=width,
        height=height,
        steps=steps,
        metrics=metrics,
        module_chain=list(runtime.provenance.module_chain),
        provenance_parameters=dict(runtime.provenance.parameters),
        provenance_meta=dict(runtime.provenance.meta),
        coupling_strength=params.coupling_strength,
        normalization_P=norm_params.P,
        normalization_V=norm_params.V,
    )
    if preset:
        session.preset = preset

    visualization = build_magnitude_visualization(
        normalized_field,
        session.provenance.id,
        max_dim=64,
        valence=metrics.valence,
        coherence=metrics.coherence,
    )
    if session.result is not None:
        session.result.visualization_ref = visualization.schema_version

    return {
        "width": width,
        "height": height,
        "valence": metrics.valence,
        "coherence": metrics.coherence,
        "symmetry": metrics.symmetry,
        "roughness": metrics.roughness,
        "richness": metrics.richness,
        "schema_version": session.schema_version,
        "engine_version": session.engine_version,
        "api_version": session.api_version,
        "seed": effective_seed,
        "provenance_id": session.provenance.id,
        "module_chain": session.provenance.module_chain,
        "preset": preset,
        "session": session.model_dump(),
        "visualization": visualization.model_dump(),
    }
