"""Gestalt Gamma - perceptual completion and organization."""

import numpy as np
from pydantic import BaseModel, Field
from scipy.ndimage import binary_closing, binary_opening

from psyfi_core.models.gestalt_profile import GestaltProfile


class GestaltGammaParams(BaseModel):
    """Parameters for Gestalt completion.

    Attributes:
        closure_bias: Strength of perceptual closure (0-1)
    """

    closure_bias: float = Field(default=0.5, ge=0.0, le=1.0)


def apply_gestalt_completion(
    field: np.ndarray,
    params: GestaltGammaParams,
) -> tuple[np.ndarray, GestaltProfile]:
    """Apply Gestalt perceptual completion.

    Uses morphological operations to complete fragmented forms,
    simulating Gestalt closure principles.

    Args:
        field: 2D complex field (height, width)
        params: Gestalt gamma parameters

    Returns:
        Tuple of (completed field, gestalt profile)
    """
    # Extract magnitude
    magnitudes = np.abs(field)
    phases = np.angle(field)

    # Threshold to binary
    threshold = np.median(magnitudes)
    binary_field = magnitudes > threshold

    # Apply morphological closing to fill gaps (Gestalt closure)
    # Size of structuring element depends on closure_bias
    struct_size = int(1 + 4 * params.closure_bias)

    closed = binary_closing(binary_field, structure=np.ones((struct_size, struct_size)))

    # Also apply opening to remove noise (simplification)
    opened = binary_opening(closed, structure=np.ones((struct_size, struct_size)))

    # Blend filled magnitude back with original
    filled_magnitude = magnitudes.copy()
    filled_magnitude[opened & ~binary_field] = magnitudes.mean()

    # Compute Gestalt metrics
    # Simplicity: ratio of filled area to total area
    simplicity_score = float(np.sum(opened) / opened.size)

    # Closure: how much was filled
    filled_pixels = np.sum(opened & ~binary_field)
    total_unfilled = np.sum(~binary_field)
    closure_score = float(filled_pixels / (total_unfilled + 1)) if total_unfilled > 0 else 0.0
    closure_score = min(1.0, closure_score)

    # Invariance: correlation between original and completed
    if magnitudes.std() > 0 and filled_magnitude.std() > 0:
        invariance_score = float(
            np.corrcoef(magnitudes.flatten(), filled_magnitude.flatten())[0, 1]
        )
    else:
        invariance_score = 1.0

    invariance_score = max(0.0, invariance_score)  # Clamp to [0, 1]

    gestalt_profile = GestaltProfile(
        simplicity_score=simplicity_score,
        closure_score=closure_score,
        invariance_score=invariance_score,
    )

    # Reconstruct field
    result = filled_magnitude * np.exp(1j * phases)

    return result.astype(np.complex64), gestalt_profile
