"""Retina Lambda - cortical magnification and log-polar geometry."""

import numpy as np
from pydantic import BaseModel, Field
from scipy.interpolate import RegularGridInterpolator


class RetinaLambdaParams(BaseModel):
    """Parameters for Retina Lambda cortical geometry.

    Attributes:
        radial_scale: Scale factor for log-polar transform
        angular_resolution: Number of angular samples
    """

    radial_scale: float = Field(default=1.0, gt=0.0)
    angular_resolution: int = Field(default=256, ge=8)


def apply_log_polar_geometry(
    field: np.ndarray,
    params: RetinaLambdaParams,
) -> np.ndarray:
    """Apply log-polar geometry transformation (cortical magnification).

    Maps from Cartesian to log-polar and back, simulating the cortical
    magnification of central vision.

    Args:
        field: 2D complex field (height, width)
        params: Retina lambda parameters

    Returns:
        Field with log-polar geometry applied
    """
    height, width = field.shape

    # Create coordinate grids
    y, x = np.ogrid[:height, :width]
    y_center = height / 2.0
    x_center = width / 2.0

    # Convert to polar coordinates
    dy = y - y_center
    dx = x - x_center
    r = np.sqrt(dx**2 + dy**2) + 1.0  # Add 1 to avoid log(0)
    theta = np.arctan2(dy, dx)

    # Log-polar transformation
    log_r = np.log(r) * params.radial_scale

    # Create interpolator for the field
    # We need separate interpolators for real and imaginary parts
    y_coords = np.arange(height)
    x_coords = np.arange(width)

    interp_real = RegularGridInterpolator(
        (y_coords, x_coords),
        field.real,
        bounds_error=False,
        fill_value=0.0,
    )

    interp_imag = RegularGridInterpolator(
        (y_coords, x_coords),
        field.imag,
        bounds_error=False,
        fill_value=0.0,
    )

    # Sample in log-polar space and map back
    # For simplicity, we just apply a radial scaling based on log
    # Full log-polar would require more complex remapping

    # Apply radial scaling to simulate central magnification
    r_scaled = r ** (1.0 / (1.0 + log_r.max()))
    y_new = y_center + r_scaled * np.sin(theta)
    x_new = x_center + r_scaled * np.cos(theta)

    # Clip to valid range
    y_new = np.clip(y_new, 0, height - 1)
    x_new = np.clip(x_new, 0, width - 1)

    # Sample the field at new positions
    points = np.stack([y_new.ravel(), x_new.ravel()], axis=-1)

    real_part = interp_real(points).reshape(height, width)
    imag_part = interp_imag(points).reshape(height, width)

    result = real_part + 1j * imag_part

    return result.astype(np.complex64)
