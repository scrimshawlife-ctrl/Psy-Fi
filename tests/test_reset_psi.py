"""Tests for reset_psi seed isolation and provenance."""

import numpy as np

from psyfi_core import ABXRuntime
from psyfi_core.engines.reset_psi import apply_phase_reset


def _field(seed: int = 7, size: int = 8) -> np.ndarray:
    rng = np.random.default_rng(seed)
    phases = rng.uniform(-np.pi, np.pi, size=(size, size))
    return np.exp(1j * phases).astype(np.complex64)


def test_seeded_reset_records_provenance_on_caller() -> None:
    """Seeded resets must write module/seed provenance onto the caller runtime."""
    runtime = ABXRuntime(deterministic=True, seed=1)
    result = apply_phase_reset(_field(), strength=0.75, runtime=runtime, seed=99)

    assert result.shape == (8, 8)
    assert runtime.provenance.module_chain == ["reset_psi"]
    assert runtime.provenance.parameters["reset_strength"] == 0.75
    assert runtime.provenance.parameters["seed"] == 99
    assert runtime.provenance.meta["seed_override"] == 99
    assert runtime.provenance.meta["seed_source"] == "reset_psi"


def test_unseeded_reset_still_records_module() -> None:
    """Default path should keep using the caller RNG and record provenance."""
    runtime = ABXRuntime(deterministic=True, seed=42)
    apply_phase_reset(_field(), strength=0.5, runtime=runtime)

    assert runtime.provenance.module_chain == ["reset_psi"]
    assert runtime.provenance.parameters["seed"] == 42
    assert "seed_override" not in runtime.provenance.meta


def test_same_seed_is_deterministic_across_runtimes() -> None:
    """Identical explicit seeds should produce identical phase resets."""
    field = _field()
    runtime_a = ABXRuntime(deterministic=True, seed=1)
    runtime_b = ABXRuntime(deterministic=True, seed=999)

    result_a = apply_phase_reset(field.copy(), strength=1.0, runtime=runtime_a, seed=123)
    result_b = apply_phase_reset(field.copy(), strength=1.0, runtime=runtime_b, seed=123)

    assert np.allclose(result_a, result_b)


def test_different_seeds_produce_different_fields() -> None:
    """Different explicit seeds should diverge when strength is non-zero."""
    field = _field()
    runtime = ABXRuntime(deterministic=True, seed=1)

    result_a = apply_phase_reset(field.copy(), strength=1.0, runtime=runtime, seed=11)
    result_b = apply_phase_reset(field.copy(), strength=1.0, runtime=runtime, seed=22)

    assert not np.allclose(result_a, result_b)
