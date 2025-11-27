"""Archetype Phi - archetypal feature enhancement."""

from typing import Callable, Literal

import numpy as np
from pydantic import BaseModel, Field
from scipy.ndimage import laplace


class ArchetypePhiParams(BaseModel):
    """Parameters for Archetype Phi feature enhancement.

    Attributes:
        mode: Enhancement mode (edges or external)
        gain: Enhancement strength
        opacity: Blend opacity (0-1)
    """

    mode: Literal["edges", "external"] = Field(default="edges")
    gain: float = Field(default=1.5, ge=0.0)
    opacity: float = Field(default=0.5, ge=0.0, le=1.0)


def _edge_enhance(field: np.ndarray, gain: float) -> np.ndarray:
    """Enhance edges using Laplacian operator.

    Args:
        field: 2D complex field
        gain: Enhancement strength

    Returns:
        Edge-enhanced field
    """
    # Separate magnitude and phase
    magnitude = np.abs(field)
    phase = np.angle(field)

    # Apply Laplacian to magnitude for edge detection
    edges = laplace(magnitude)

    # Enhance magnitude at edges
    enhanced_magnitude = magnitude + gain * np.abs(edges)

    # Recombine with original phase
    result = enhanced_magnitude * np.exp(1j * phase)

    return result.astype(np.complex64)


def apply_archetype_phi(
    field: np.ndarray,
    params: ArchetypePhiParams,
    external_feature_enhancer: Callable[[np.ndarray], np.ndarray] | None = None,
) -> np.ndarray:
    """Apply archetypal feature enhancement.

    Enhances salient features like edges or applies external enhancement.

    Args:
        field: 2D complex field
        params: Archetype phi parameters
        external_feature_enhancer: Optional external enhancement function

    Returns:
        Enhanced field
    """
    if params.mode == "edges":
        enhanced = _edge_enhance(field, params.gain)
    elif params.mode == "external" and external_feature_enhancer is not None:
        enhanced = external_feature_enhancer(field)
    else:
        # No enhancement
        enhanced = field

    # Blend with original based on opacity
    result = params.opacity * enhanced + (1.0 - params.opacity) * field

    return result.astype(np.complex64)
