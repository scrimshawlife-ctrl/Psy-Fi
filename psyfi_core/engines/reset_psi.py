"""Reset Psi - phase reset for DMT-like state transitions."""

import numpy as np

from psyfi_core.abx_core import ABXRuntime


def apply_phase_reset(
    field: np.ndarray,
    strength: float,
    runtime: ABXRuntime,
) -> np.ndarray:
    """Apply phase reset (DMT-like reality dissolution).

    Blends current phases with random noise to simulate the breakdown
    of coherent patterns during intense psychedelic experiences.

    Args:
        field: 2D complex field (height, width)
        strength: Reset strength (0 = no reset, 1 = complete randomization)
        runtime: ABX runtime for deterministic RNG

    Returns:
        Field with phase reset applied
    """
    # Extract magnitude and phase
    magnitudes = np.abs(field)
    phases = np.angle(field)

    # Generate random phases using runtime RNG for determinism
    random_phases = runtime.rng.uniform(-np.pi, np.pi, size=phases.shape)

    # Blend current phases with random phases
    alpha = np.clip(strength, 0.0, 1.0)
    new_phases = (1.0 - alpha) * phases + alpha * random_phases

    # Reconstruct field with original magnitudes and new phases
    result = magnitudes * np.exp(1j * new_phases)

    # Update provenance
    runtime.provenance.add_module("reset_psi")
    runtime.provenance.add_parameter("reset_strength", strength)

    return result.astype(np.complex64)
