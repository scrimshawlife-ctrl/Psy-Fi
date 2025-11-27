"""Resonance Chi - resonance mode analysis."""

from typing import Any

import numpy as np


def compute_resonance_modes(field: np.ndarray, num_modes: int = 8) -> dict[str, Any]:
    """Compute dominant resonance modes via FFT analysis.

    Analyzes the frequency spectrum to identify dominant resonance modes.

    Args:
        field: 2D complex field (height, width)
        num_modes: Number of top modes to extract

    Returns:
        Dictionary with mode statistics
    """
    # Compute 2D FFT
    fft = np.fft.fft2(field)
    fft_shifted = np.fft.fftshift(fft)

    # Magnitude spectrum
    magnitude_spectrum = np.abs(fft_shifted)

    # Find top N modes (excluding DC component at center)
    height, width = field.shape
    center_y, center_x = height // 2, width // 2

    # Mask out center DC component
    mask = np.ones_like(magnitude_spectrum, dtype=bool)
    mask[center_y - 2 : center_y + 3, center_x - 2 : center_x + 3] = False

    masked_spectrum = magnitude_spectrum.copy()
    masked_spectrum[~mask] = 0

    # Get top modes
    flat_indices = np.argsort(masked_spectrum.ravel())[-num_modes:]
    top_indices = np.unravel_index(flat_indices, magnitude_spectrum.shape)

    # Get magnitudes of top modes
    top_magnitudes = magnitude_spectrum[top_indices]

    # Compute statistics
    total_power = float(np.sum(magnitude_spectrum**2))
    top_modes_power = float(np.sum(top_magnitudes**2))
    power_concentration = top_modes_power / (total_power + 1e-8)

    # Average frequency of top modes (distance from center)
    distances = np.sqrt(
        (top_indices[0] - center_y) ** 2 + (top_indices[1] - center_x) ** 2
    )
    avg_frequency = float(np.mean(distances))

    return {
        "num_modes": num_modes,
        "top_magnitudes": top_magnitudes.tolist(),
        "power_concentration": power_concentration,
        "avg_frequency": avg_frequency,
        "total_power": total_power,
    }
