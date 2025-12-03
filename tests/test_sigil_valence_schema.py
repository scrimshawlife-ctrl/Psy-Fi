"""Tests for valence metrics computation."""

import numpy as np

from psyfi_core.models import ValenceMetrics
from psyfi_core.engines import compute_valence_metrics


def test_compute_valence_metrics_all_zeros() -> None:
    """Test valence metrics on a zero field."""
    # Create a field with all zeros
    field = np.zeros((32, 32), dtype=np.complex64)

    metrics = compute_valence_metrics(field)

    # Should return a valid ValenceMetrics object
    assert isinstance(metrics, ValenceMetrics)

    # Check all scores are finite
    assert np.isfinite(metrics.valence_score)
    assert np.isfinite(metrics.coherence_score)
    assert np.isfinite(metrics.symmetry_score)
    assert np.isfinite(metrics.roughness_score)
    assert np.isfinite(metrics.richness_score)

    # All zeros should have very low roughness
    assert metrics.roughness_score < 0.1


def test_compute_valence_metrics_uniform_phase() -> None:
    """Test valence metrics on a field with uniform phase."""
    # Create a field with uniform phase (all pointing same direction)
    # This should have high coherence
    field = np.ones((32, 32), dtype=np.complex64)

    metrics = compute_valence_metrics(field)

    assert isinstance(metrics, ValenceMetrics)

    # Uniform phase should have very high coherence
    assert metrics.coherence_score > 0.99

    # Should have low richness (no phase diversity)
    assert metrics.richness_score < 0.1

    # Valence score should be in valid range
    assert -1.0 <= metrics.valence_score <= 1.0


def test_compute_valence_metrics_random_field() -> None:
    """Test valence metrics on a random field."""
    # Create a random field
    np.random.seed(42)
    phases = np.random.uniform(-np.pi, np.pi, size=(32, 32))
    magnitudes = np.random.uniform(0.5, 1.5, size=(32, 32))
    field = (magnitudes * np.exp(1j * phases)).astype(np.complex64)

    metrics = compute_valence_metrics(field)

    assert isinstance(metrics, ValenceMetrics)

    # All scores should be finite
    assert np.isfinite(metrics.valence_score)
    assert np.isfinite(metrics.coherence_score)
    assert np.isfinite(metrics.symmetry_score)
    assert np.isfinite(metrics.roughness_score)
    assert np.isfinite(metrics.richness_score)

    # Random field should have moderate coherence (not too high)
    assert metrics.coherence_score < 0.5

    # Should have some richness
    assert metrics.richness_score > 0.1

    # Confidence should be reasonable
    assert 0.0 <= metrics.confidence <= 1.0

    # Valence score should be normalized
    assert -1.0 <= metrics.valence_score <= 1.0


def test_valence_metrics_in_range() -> None:
    """Test that valence metrics are in valid ranges."""
    # Create various fields and check ranges
    for seed in [42, 99, 123]:
        np.random.seed(seed)
        phases = np.random.uniform(-np.pi, np.pi, size=(16, 16))
        magnitudes = np.random.uniform(0.1, 2.0, size=(16, 16))
        field = (magnitudes * np.exp(1j * phases)).astype(np.complex64)

        metrics = compute_valence_metrics(field)

        # Check all metrics are in valid ranges
        assert 0.0 <= metrics.coherence_score <= 1.0
        assert 0.0 <= metrics.symmetry_score <= 1.0
        assert 0.0 <= metrics.roughness_score <= 1.0
        assert 0.0 <= metrics.richness_score <= 1.0
        assert 0.0 <= metrics.confidence <= 1.0

        # Valence score is normalized to [-1, 1]
        assert -1.0 <= metrics.valence_score <= 1.0


def test_combined_valence_normalization_extremes() -> None:
    """Ensure combined valence spans the documented [-1, 1] range."""

    min_metrics = ValenceMetrics(
        coherence_score=0.0,
        symmetry_score=0.0,
        roughness_score=1.0,
        richness_score=0.0,
    )

    max_metrics = ValenceMetrics(
        coherence_score=1.0,
        symmetry_score=1.0,
        roughness_score=0.0,
        richness_score=1.0,
    )

    assert min_metrics.compute_combined_valence() == -1.0
    assert max_metrics.compute_combined_valence() == 1.0
