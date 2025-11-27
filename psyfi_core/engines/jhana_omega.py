"""Jhana Omega - meditative absorption states."""

import numpy as np
from pydantic import BaseModel, Field
from scipy.ndimage import gaussian_filter


class JhanaOmegaParams(BaseModel):
    """Parameters for Jhana absorption.

    Attributes:
        focus_x: X-coordinate of attention focus (0-1, fraction of width)
        focus_y: Y-coordinate of attention focus (0-1, fraction of height)
        radius: Radius of absorption region (0-1, fraction of size)
        smooth_gain: Strength of smoothing within focus region
    """

    focus_x: float = Field(default=0.5, ge=0.0, le=1.0)
    focus_y: float = Field(default=0.5, ge=0.0, le=1.0)
    radius: float = Field(default=0.3, ge=0.0, le=1.0)
    smooth_gain: float = Field(default=0.5, ge=0.0, le=1.0)


def apply_jhana_absorption(
    field: np.ndarray,
    params: JhanaOmegaParams,
) -> np.ndarray:
    """Apply jhana absorption - local smoothing around attentional focus.

    Simulates the focusing and unification of consciousness in jhana states
    by smoothing the field in the region of attention.

    Args:
        field: 2D complex field (height, width)
        params: Jhana parameters

    Returns:
        Field with jhana absorption applied
    """
    height, width = field.shape

    # Compute focus coordinates in pixels
    focus_x_px = int(params.focus_x * width)
    focus_y_px = int(params.focus_y * height)
    radius_px = int(params.radius * min(width, height))

    # Create distance map from focus
    y, x = np.ogrid[:height, :width]
    dist = np.sqrt((x - focus_x_px) ** 2 + (y - focus_y_px) ** 2)

    # Create absorption mask (Gaussian falloff from focus)
    absorption_mask = np.exp(-(dist**2) / (2 * radius_px**2))

    # Smooth the field
    sigma = 2.0 * params.smooth_gain
    smoothed = gaussian_filter(field.real, sigma=sigma) + 1j * gaussian_filter(
        field.imag, sigma=sigma
    )

    # Blend smoothed and original based on absorption mask
    result = absorption_mask * smoothed + (1.0 - absorption_mask) * field

    return result.astype(np.complex64)
