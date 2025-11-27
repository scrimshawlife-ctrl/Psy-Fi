"""Valence Kappa - comprehensive hedonic valence assessment."""

import numpy as np

from psyfi_core.models.valence_metrics import ValenceMetrics


def compute_valence_metrics(field: np.ndarray) -> ValenceMetrics:
    """Compute comprehensive valence metrics from a consciousness field.

    Analyzes the field to extract multiple dimensions of hedonic tone:
    - Coherence: Phase synchronization (order parameter)
    - Symmetry: Spatial symmetry across quadrants
    - Roughness: Spatial gradient energy
    - Richness: Phase diversity

    Args:
        field: 2D complex field (height, width)

    Returns:
        ValenceMetrics with computed scores
    """
    height, width = field.shape

    # Extract phase and magnitude
    phases = np.angle(field)
    magnitudes = np.abs(field)

    # 1. Coherence: Order parameter (Kuramoto order parameter)
    # R = |⟨e^(iθ)⟩|
    mean_complex = np.mean(np.exp(1j * phases))
    coherence_score = float(np.abs(mean_complex))

    # 2. Symmetry: Compare quadrants
    mid_h = height // 2
    mid_w = width // 2

    quad_tl = field[:mid_h, :mid_w]
    quad_tr = field[:mid_h, mid_w:]
    quad_bl = field[mid_h:, :mid_w]
    quad_br = field[mid_h:, mid_w:]

    # Correlation between opposite quadrants
    def quadrant_correlation(q1: np.ndarray, q2: np.ndarray) -> float:
        """Compute correlation between two quadrants."""
        if q1.size == 0 or q2.size == 0:
            return 0.0

        # Resize to same shape if needed
        min_h = min(q1.shape[0], q2.shape[0])
        min_w = min(q1.shape[1], q2.shape[1])
        q1 = q1[:min_h, :min_w]
        q2 = q2[:min_h, :min_w]

        # Correlation of magnitudes
        mag1 = np.abs(q1).flatten()
        mag2 = np.abs(q2).flatten()

        if mag1.std() == 0 or mag2.std() == 0:
            return 0.0

        corr = np.corrcoef(mag1, mag2)[0, 1]
        return float(np.abs(corr)) if not np.isnan(corr) else 0.0

    # Average correlation across quadrant pairs
    sym_h = quadrant_correlation(quad_tl, quad_bl)  # Top-left vs bottom-left
    sym_v = quadrant_correlation(quad_tl, quad_tr)  # Top-left vs top-right
    sym_d = quadrant_correlation(quad_tl, quad_br)  # Diagonal

    symmetry_score = (sym_h + sym_v + sym_d) / 3.0

    # 3. Roughness: Spatial gradient energy
    grad_y, grad_x = np.gradient(magnitudes)
    gradient_energy = np.sqrt(grad_x**2 + grad_y**2)
    roughness_score = float(np.mean(gradient_energy))

    # Normalize roughness to [0, 1]
    # Typical gradient energy is small, so we scale it
    roughness_score = min(1.0, roughness_score / (magnitudes.mean() + 1e-8))

    # 4. Richness: Phase variance/diversity
    phase_variance = float(np.var(phases))
    # Phase variance is in [0, π²], normalize to [0, 1]
    richness_score = min(1.0, phase_variance / (np.pi**2))

    # 5. Combined valence score
    # High coherence + high symmetry = positive
    # High roughness = negative
    # Moderate richness = positive (too low or too high is bad)
    richness_contribution = 1.0 - abs(richness_score - 0.5) * 2  # Peak at 0.5

    valence_score = (
        0.4 * coherence_score
        + 0.3 * symmetry_score
        - 0.2 * roughness_score
        + 0.1 * richness_contribution
    )

    # Confidence is based on how much activity there is
    mean_magnitude = float(np.mean(magnitudes))
    confidence = min(1.0, mean_magnitude / (magnitudes.max() + 1e-8))

    return ValenceMetrics(
        valence_score=valence_score,
        coherence_score=coherence_score,
        symmetry_score=symmetry_score,
        roughness_score=roughness_score,
        richness_score=richness_score,
        confidence=confidence,
    )
