"""Ethics Sigma - ethical assessment of consciousness states."""

from dataclasses import dataclass

from psyfi_core.models.valence_metrics import ValenceMetrics
from psyfi_core.models.negative_valence import NegativeValenceSignature


@dataclass
class EthicsAssessment:
    """Ethical assessment of a consciousness state.

    Attributes:
        risk_score: Overall ethical risk (higher = more concerning)
        suffering_risk: Estimated suffering/distress level (0-1)
        bliss_potential: Potential for positive experience (0-1)
    """

    risk_score: float
    suffering_risk: float
    bliss_potential: float


def assess_ethics(
    valence: ValenceMetrics,
    negative: NegativeValenceSignature,
) -> EthicsAssessment:
    """Assess the ethical status of a consciousness state.

    Combines positive valence metrics with negative pathology markers
    to estimate suffering risk and bliss potential.

    Args:
        valence: Positive valence metrics
        negative: Negative valence signature

    Returns:
        EthicsAssessment with risk scores
    """
    # Compute suffering risk from negative markers
    suffering_risk = negative.compute_suffering_risk()

    # Compute bliss potential from positive metrics
    # Coherence and symmetry contribute to positive experience
    bliss_potential = (
        valence.coherence_score * 0.5
        + valence.symmetry_score * 0.3
        + (1.0 - valence.roughness_score) * 0.2
    )

    # Overall risk balances suffering against bliss
    # High suffering risk is bad, high bliss potential is good
    risk_score = suffering_risk - 0.5 * bliss_potential

    return EthicsAssessment(
        risk_score=risk_score,
        suffering_risk=suffering_risk,
        bliss_potential=bliss_potential,
    )
