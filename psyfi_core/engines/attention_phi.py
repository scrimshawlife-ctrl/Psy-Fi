"""Attention Phi - attentional modulation of field."""

import numpy as np
from pydantic import BaseModel, Field


class AttentionPhiParams(BaseModel):
    """Parameters for attention modulation.

    Attributes:
        focus_x: X-coordinate of attention focus (0-1, fraction of width)
        focus_y: Y-coordinate of attention focus (0-1, fraction of height)
        gain: Attention gain at focus (multiplier for magnitude)
    """

    focus_x: float = Field(default=0.5, ge=0.0, le=1.0)
    focus_y: float = Field(default=0.5, ge=0.0, le=1.0)
    gain: float = Field(default=0.5, ge=0.0)


def apply_attention_modulation(
    field: np.ndarray,
    params: AttentionPhiParams,
) -> np.ndarray:
    """Apply attentional gain modulation.

    Increases magnitude at the focus of attention with Gaussian falloff.

    Args:
        field: 2D complex field (height, width)
        params: Attention parameters

    Returns:
        Field with attention modulation applied
    """
    height, width = field.shape

    # Compute focus coordinates in pixels
    focus_x_px = params.focus_x * width
    focus_y_px = params.focus_y * height

    # Create distance map from focus
    y, x = np.ogrid[:height, :width]
    dist_sq = (x - focus_x_px) ** 2 + (y - focus_y_px) ** 2

    # Gaussian attention mask
    # Use adaptive sigma based on image size
    sigma = 0.25 * min(width, height)
    attention_mask = np.exp(-dist_sq / (2 * sigma**2))

    # Gain modulation: 1 + gain * mask
    # At focus: multiplier is (1 + gain)
    # Far from focus: multiplier approaches 1
    gain_field = 1.0 + params.gain * attention_mask

    # Apply gain to magnitude, preserve phase
    magnitudes = np.abs(field)
    phases = np.angle(field)

    modulated_magnitude = magnitudes * gain_field

    result = modulated_magnitude * np.exp(1j * phases)

    return result.astype(np.complex64)
