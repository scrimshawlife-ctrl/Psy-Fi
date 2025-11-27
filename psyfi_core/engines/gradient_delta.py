"""Gradient Delta - spatial gradient and drift effects."""

import numpy as np
from pydantic import BaseModel, Field


class GradientDeltaParams(BaseModel):
    """Parameters for Gradient Delta spatial effects.

    Attributes:
        amplitude: Strength of the drift effect
        velocity: Speed of the drift oscillation
        spatial_scale: Spatial wavelength of the drift pattern
    """

    amplitude: float = Field(default=0.05, ge=0.0)
    velocity: float = Field(default=1.0)
    spatial_scale: float = Field(default=2.0, gt=0.0)


def apply_gradient_delta(
    field: np.ndarray,
    t: float,
    params: GradientDeltaParams,
) -> np.ndarray:
    """Apply spatial gradient and breathing/drift effects.

    Creates radial breathing or drifting using sinusoidal displacement.

    Args:
        field: 2D complex field (height, width)
        t: Time parameter
        params: Gradient delta parameters

    Returns:
        Field with gradient drift applied
    """
    height, width = field.shape

    # Create coordinate grids centered at origin
    y, x = np.ogrid[:height, :width]
    y_center = height / 2.0
    x_center = width / 2.0

    # Radial distance from center
    r = np.sqrt((x - x_center) ** 2 + (y - y_center) ** 2)

    # Radial breathing: displacement depends on radius and time
    displacement = params.amplitude * np.sin(
        2 * np.pi * r / (params.spatial_scale * width) + params.velocity * t
    )

    # Apply phase shift based on displacement
    # This creates a radial breathing/drifting effect
    phase_shift = 2 * np.pi * displacement

    result = field * np.exp(1j * phase_shift)

    return result.astype(np.complex64)
