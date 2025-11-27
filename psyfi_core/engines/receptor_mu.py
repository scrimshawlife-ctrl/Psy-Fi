"""Receptor Mu - receptor-based modulation of normalization."""

from psyfi_core.models.receptor_profile import ReceptorProfile
from psyfi_core.engines.normalization_nu import NormalizationParams


def apply_receptor_modulation(
    norm_params: NormalizationParams,
    receptors: ReceptorProfile,
) -> NormalizationParams:
    """Modulate normalization parameters based on receptor densities.

    Heuristic mapping from receptor densities to normalization:
    - High 5-HT2A → lower V (reduced divisive inhibition)
    - High GABA → higher V (increased inhibition)
    - High sigma-1 → reduced P (altered nonlinearity)

    Args:
        norm_params: Base normalization parameters
        receptors: Receptor profile

    Returns:
        Modulated normalization parameters
    """
    # Start with base parameters
    P = norm_params.P
    V = norm_params.V
    surround_radius = norm_params.surround_radius

    # 5-HT2A agonism reduces divisive normalization
    # More 5-HT2A → lower V → less lateral inhibition
    V_modulation = 1.0 / (1.0 + 0.3 * (receptors.h5ht2a_density - 1.0))
    V = V * V_modulation

    # GABA increases divisive normalization
    # More GABA → higher V → more inhibition
    V = V * (1.0 + 0.2 * (receptors.gaba_density - 1.0))

    # Sigma-1 modulates nonlinearity exponent
    # Reduces P slightly
    P = P * (1.0 - 0.1 * (receptors.sigma1_density - 1.0))

    # Clamp to valid ranges
    P = max(0.1, min(3.0, P))
    V = max(0.0, min(5.0, V))

    return NormalizationParams(
        P=P,
        V=V,
        surround_radius=surround_radius,
    )
