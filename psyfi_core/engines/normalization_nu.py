"""Normalization Nu - divisive normalization for contrast control."""

import numpy as np
from pydantic import BaseModel, Field
from scipy.ndimage import uniform_filter


class NormalizationParams(BaseModel):
    """Parameters for divisive normalization.

    Attributes:
        P: Exponent for activation nonlinearity
        V: Strength of divisive normalization
        surround_radius: Radius for surround computation (pixels)
    """

    P: float = Field(default=1.0, gt=0.0)
    V: float = Field(default=1.0, ge=0.0)
    surround_radius: int = Field(default=3, ge=1)


def apply_normalization(
    field: np.ndarray,
    params: NormalizationParams,
) -> np.ndarray:
    """Apply divisive normalization to the field.

    Implements divisive normalization:
    output = activation^P / (1 + V * surround^P)

    This controls contrast and implements gain control.

    Args:
        field: 2D complex field (height, width)
        params: Normalization parameters

    Returns:
        Normalized field
    """
    # Extract magnitude and phase
    magnitudes = np.abs(field)
    phases = np.angle(field)

    # Activation: magnitude raised to power P
    activation = magnitudes**params.P

    # Compute surround using local average
    surround = uniform_filter(
        activation,
        size=2 * params.surround_radius + 1,
        mode="constant",
    )

    # Divisive normalization
    denominator = 1.0 + params.V * (surround**params.P)
    normalized_magnitude = activation / denominator

    # Reconstruct field with normalized magnitude
    result = normalized_magnitude * np.exp(1j * phases)

    return result.astype(np.complex64)
