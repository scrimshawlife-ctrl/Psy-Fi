"""Topology Tau - topological smoothing and regularization."""

import numpy as np
from pydantic import BaseModel, Field
from scipy.ndimage import gaussian_filter


class TopologyTauParams(BaseModel):
    """Parameters for topological smoothing.

    Attributes:
        smoothing_sigma: Sigma for Gaussian smoothing
    """

    smoothing_sigma: float = Field(default=1.5, ge=0.0)


def apply_topological_smoothing(
    field: np.ndarray,
    params: TopologyTauParams,
) -> np.ndarray:
    """Apply topological smoothing to the field.

    Smooths both magnitude and phase to regularize the field topology.

    Args:
        field: 2D complex field (height, width)
        params: Topology tau parameters

    Returns:
        Smoothed field
    """
    if params.smoothing_sigma <= 0:
        return field

    # Smooth real and imaginary parts separately
    # This preserves the complex structure better than smoothing mag/phase
    real_smoothed = gaussian_filter(field.real, sigma=params.smoothing_sigma)
    imag_smoothed = gaussian_filter(field.imag, sigma=params.smoothing_sigma)

    result = real_smoothed + 1j * imag_smoothed

    return result.astype(np.complex64)
