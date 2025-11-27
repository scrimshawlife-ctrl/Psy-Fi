"""Geometry Lambda - geometric simplicity metrics."""

from typing import Any

import numpy as np


def compute_simplicity_metrics(field: np.ndarray) -> dict[str, Any]:
    """Compute geometric simplicity metrics from a field.

    Analyzes phase and magnitude variance to assess geometric complexity.

    Args:
        field: 2D complex field (height, width)

    Returns:
        Dictionary with simplicity metrics
    """
    # Extract phase and magnitude
    phases = np.angle(field)
    magnitudes = np.abs(field)

    # Phase variance (lower = more uniform = simpler)
    phase_variance = float(np.var(phases))

    # Magnitude variance (lower = more uniform = simpler)
    magnitude_variance = float(np.var(magnitudes))

    # Normalize variances
    # Phase variance is in [0, π²]
    normalized_phase_var = phase_variance / (np.pi**2)

    # Magnitude variance normalized by mean²
    mean_mag = magnitudes.mean()
    normalized_mag_var = magnitude_variance / (mean_mag**2 + 1e-8)

    # Simplicity is inverse of variance
    # High variance = complex = low simplicity
    phase_simplicity = 1.0 - min(1.0, normalized_phase_var)
    magnitude_simplicity = 1.0 - min(1.0, normalized_mag_var / 10.0)  # Scale factor

    # Overall simplicity
    overall_simplicity = (phase_simplicity + magnitude_simplicity) / 2.0

    return {
        "phase_variance": phase_variance,
        "magnitude_variance": magnitude_variance,
        "phase_simplicity": phase_simplicity,
        "magnitude_simplicity": magnitude_simplicity,
        "overall_simplicity": overall_simplicity,
    }
