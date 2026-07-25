"""Reset Psi - phase reset for DMT-like state transitions."""

import numpy as np

from psyfi_core.abx_core import ABXRuntime


def apply_phase_reset(
    field: np.ndarray,
    strength: float,
    runtime: ABXRuntime,
    seed: int | None = None,
) -> np.ndarray:
    """Apply phase reset (DMT-like reality dissolution).

    Blends current phases with random noise to simulate the breakdown
    of coherent patterns during intense psychedelic experiences.

    Args:
        field: 2D complex field (height, width)
        strength: Reset strength (0 = no reset, 1 = complete randomization)
        runtime: ABX runtime for deterministic RNG
        seed: Optional seed override for deterministic randomness

    Returns:
        Field with phase reset applied
    """
    # Fork RNG when an explicit seed is provided, but keep provenance on the
    # caller runtime so seeded resets remain visible to the parent chain.
    rng_runtime = runtime
    if seed is not None:
        rng_runtime = runtime.fork_with_seed(
            seed, extra_meta={"seed_source": "reset_psi"}
        )

    # Extract magnitude and phase
    magnitudes = np.abs(field)
    phases = np.angle(field)

    # Generate random phases using runtime RNG for determinism
    random_phases = rng_runtime.rng.uniform(-np.pi, np.pi, size=phases.shape)

    # Blend current phases with random phases
    alpha = np.clip(strength, 0.0, 1.0)
    new_phases = (1.0 - alpha) * phases + alpha * random_phases

    # Reconstruct field with original magnitudes and new phases
    result = magnitudes * np.exp(1j * new_phases)

    # Update provenance on the caller runtime
    runtime.provenance.add_module("reset_psi")
    runtime.provenance.add_parameter("reset_strength", strength)
    runtime.provenance.add_parameter("seed", rng_runtime.seed)
    if seed is not None:
        runtime.provenance.add_meta("seed_override", seed)
        runtime.provenance.add_meta("seed_source", "reset_psi")

    return result.astype(np.complex64)
