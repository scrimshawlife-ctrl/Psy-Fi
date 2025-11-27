"""Echo Tau - temporal echo and persistence effects."""

import numpy as np
from pydantic import BaseModel, Field


class EchoTauParams(BaseModel):
    """Parameters for Echo Tau temporal blending.

    Attributes:
        decay: Decay factor for previous frame (0-1)
        luminance_bias: Brightness-dependent decay bias
    """

    decay: float = Field(default=0.9, ge=0.0, le=1.0)
    luminance_bias: float = Field(default=0.0)


def apply_echo_tau(
    prev_frame: np.ndarray,
    current_frame: np.ndarray,
    params: EchoTauParams,
) -> np.ndarray:
    """Apply temporal echo blending between frames.

    Creates visual persistence and motion trails.

    Args:
        prev_frame: Previous frame (2D complex array)
        current_frame: Current frame (2D complex array)
        params: Echo parameters

    Returns:
        Blended frame with echo effect
    """
    # Simple weighted blend
    alpha = 1.0 - params.decay

    # Optional luminance-dependent bias
    if params.luminance_bias != 0.0:
        # Brighter areas persist more/less based on bias
        magnitude = np.abs(current_frame)
        normalized_mag = magnitude / (magnitude.max() + 1e-8)
        alpha_field = alpha * (1.0 + params.luminance_bias * normalized_mag)
        alpha_field = np.clip(alpha_field, 0.0, 1.0)
    else:
        alpha_field = alpha

    # Blend: result = alpha * current + (1-alpha) * prev
    result = alpha_field * current_frame + (1.0 - alpha_field) * prev_frame

    return result.astype(np.complex64)
