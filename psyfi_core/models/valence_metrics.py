"""Valence metrics - comprehensive hedonic tone assessment."""

from pydantic import BaseModel, Field


class ValenceMetrics(BaseModel):
    """Comprehensive metrics for hedonic tone assessment.

    These metrics combine to provide a multi-dimensional view
    of the subjective quality of a consciousness state.

    Attributes:
        valence_score: Overall hedonic valence (-1 to 1, negative to positive)
        coherence_score: Field coherence/synchrony (0 to 1)
        symmetry_score: Spatial symmetry of the field (0 to 1)
        roughness_score: Spatial roughness/gradient energy (0 to 1)
        richness_score: Phase diversity/complexity (0 to 1)
        confidence: Confidence in these metrics (0 to 1)
    """

    valence_score: float = Field(default=0.0)
    coherence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    symmetry_score: float = Field(default=0.0, ge=0.0, le=1.0)
    roughness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    richness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    def compute_combined_valence(self) -> float:
        """Compute a combined valence score from component metrics.

        Returns:
            Combined valence score
        """
        # Weighted combination:
        # - Coherence and symmetry are positive
        # - Excessive roughness is negative
        # - Richness is mildly positive
        valence = (
            0.4 * self.coherence_score
            + 0.3 * self.symmetry_score
            - 0.2 * self.roughness_score
            + 0.1 * self.richness_score
        )
        # Scale to [-1, 1] range
        return 2.0 * valence - 1.0
