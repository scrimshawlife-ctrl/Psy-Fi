"""Boundary Theta - object binding and segmentation."""

import numpy as np
from scipy.ndimage import label


def compute_binding_segments(field: np.ndarray, threshold: float = 0.2) -> np.ndarray:
    """Compute perceptual binding segments from a consciousness field.

    Uses magnitude and local coherence to identify bound objects.
    High magnitude + low gradient = coherent bound object.

    Args:
        field: 2D complex field (height, width)
        threshold: Threshold for binding (0 to 1)

    Returns:
        2D integer array with segment labels (0 = background)
    """
    # Compute magnitude
    magnitude = np.abs(field)

    # Compute phase gradient as a measure of local incoherence
    phase = np.angle(field)
    grad_y, grad_x = np.gradient(phase)
    grad_energy = np.sqrt(grad_x**2 + grad_y**2)

    # Coherence is inverse of gradient energy
    # Use 1/(1+x) to map [0, inf) -> [0, 1]
    coherence = 1.0 / (1.0 + grad_energy**2)

    # Binding score combines magnitude and coherence
    binding_score = magnitude * coherence

    # Normalize to [0, 1]
    if binding_score.max() > 0:
        binding_score = binding_score / binding_score.max()

    # Threshold to get binary mask
    binding_mask = binding_score > threshold

    # Label connected components
    labeled_segments, num_segments = label(binding_mask)

    return labeled_segments.astype(np.int32)
