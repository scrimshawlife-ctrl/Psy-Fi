"""Meditative profile - tracks meditative state qualities."""

from pydantic import BaseModel, Field


class MeditativeProfile(BaseModel):
    """Tracks qualities of meditative absorption states.

    Attributes:
        attention_stability: How stable attention is (0-1)
        pleasantness_gain: Multiplier for positive valence (>= 0)
        equanimity: Degree of non-reactivity (0-1)
        collapse_risk: Risk of losing the meditative state (0-1)
    """

    attention_stability: float = Field(default=0.5, ge=0.0, le=1.0)
    pleasantness_gain: float = Field(default=1.0, ge=0.0)
    equanimity: float = Field(default=0.5, ge=0.0, le=1.0)
    collapse_risk: float = Field(default=0.3, ge=0.0, le=1.0)

    def update_from_coherence(self, coherence: float) -> None:
        """Update meditative qualities based on field coherence.

        High coherence suggests stable attention and low collapse risk.

        Args:
            coherence: Field coherence measure (0-1)
        """
        # Higher coherence → more stable attention
        alpha = 0.1
        self.attention_stability += alpha * (coherence - self.attention_stability)

        # Higher stability → lower collapse risk
        self.collapse_risk = 1.0 - self.attention_stability

        # Stability increases pleasantness gain
        self.pleasantness_gain = 1.0 + self.attention_stability

        # High stability → high equanimity
        self.equanimity += alpha * (self.attention_stability - self.equanimity)
