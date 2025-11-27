"""Psychedelic Delta - psilocybin-like context shift."""

import numpy as np
from scipy.ndimage import gaussian_filter

from psyfi_core.abx_core import ABXRuntime


def apply_psychedelic_context_shift(
    field: np.ndarray,
    intensity: float,
    runtime: ABXRuntime,
) -> np.ndarray:
    """Apply psilocybin-like context shift.

    Simulates the "softening" and emotional depth characteristic
    of psilocybin by blurring magnitude and low-pass filtering phase.

    Args:
        field: 2D complex field (height, width)
        intensity: Context shift intensity (0-1)
        runtime: ABX runtime for tracking

    Returns:
        Field with psychedelic context shift
    """
    # Extract magnitude and phase
    magnitudes = np.abs(field)
    phases = np.angle(field)

    # Blur magnitude (softening, emotional depth)
    sigma = 1.0 + 2.0 * intensity
    blurred_magnitude = gaussian_filter(magnitudes, sigma=sigma)

    # Blend original and blurred magnitudes
    alpha = np.clip(intensity, 0.0, 1.0)
    new_magnitude = (1.0 - alpha) * magnitudes + alpha * blurred_magnitude

    # Low-pass filter phases (reduces sharp transitions)
    phase_real = np.cos(phases)
    phase_imag = np.sin(phases)

    blurred_phase_real = gaussian_filter(phase_real, sigma=sigma)
    blurred_phase_imag = gaussian_filter(phase_imag, sigma=sigma)

    # Reconstruct phases from blurred sin/cos
    blurred_phases = np.arctan2(blurred_phase_imag, blurred_phase_real)

    # Blend original and blurred phases
    # We need to blend in the complex plane to avoid wrap-around issues
    original_complex_phase = np.exp(1j * phases)
    blurred_complex_phase = np.exp(1j * blurred_phases)

    blended_complex_phase = (
        (1.0 - alpha) * original_complex_phase + alpha * blurred_complex_phase
    )
    new_phases = np.angle(blended_complex_phase)

    # Reconstruct field
    result = new_magnitude * np.exp(1j * new_phases)

    # Update provenance
    runtime.provenance.add_module("psychedelic_delta")
    runtime.provenance.add_parameter("intensity", intensity)

    return result.astype(np.complex64)
