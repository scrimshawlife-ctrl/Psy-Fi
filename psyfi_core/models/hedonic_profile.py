"""Hedonic profile - tracks subjective valence and adaptive baselines."""

from typing import Any

from pydantic import BaseModel, Field


class HedonicProfile(BaseModel):
    """Tracks hedonic tone and adaptive baseline.

    This implements a simple hedonic adaptation mechanism where
    the baseline shifts toward recent positive experiences.

    Attributes:
        baseline_valence: Current hedonic baseline
        recent_valence: Recent valence measurements (FIFO buffer)
        last_helpful_params: Parameters that increased valence
        last_harmful_params: Parameters that decreased valence
    """

    baseline_valence: float = Field(default=0.0)
    recent_valence: list[float] = Field(default_factory=list)
    last_helpful_params: dict[str, Any] = Field(default_factory=dict)
    last_harmful_params: dict[str, Any] = Field(default_factory=dict)

    _max_history: int = 256

    def update(self, valence: float, params: dict[str, Any]) -> None:
        """Update the hedonic profile with a new valence measurement.

        Args:
            valence: New valence score
            params: Parameters that produced this valence
        """
        # Add to recent history
        self.recent_valence.append(valence)

        # Keep only recent history
        if len(self.recent_valence) > self._max_history:
            self.recent_valence = self.recent_valence[-self._max_history :]

        # Update helpful/harmful parameters
        if valence > self.baseline_valence:
            # Positive experience - track these parameters
            self.last_helpful_params = params.copy()

            # Slowly adapt baseline upward (hedonic adaptation)
            alpha = 0.1  # Learning rate
            self.baseline_valence += alpha * (valence - self.baseline_valence)
        else:
            # Negative experience - track these parameters
            self.last_harmful_params = params.copy()

    def get_mean_recent_valence(self) -> float:
        """Get the mean of recent valence measurements.

        Returns:
            Mean valence, or baseline if no recent measurements
        """
        if not self.recent_valence:
            return self.baseline_valence
        return sum(self.recent_valence) / len(self.recent_valence)
