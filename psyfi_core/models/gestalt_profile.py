"""Gestalt profile - perceptual organization metrics."""

from pydantic import BaseModel, Field


class GestaltProfile(BaseModel):
    """Metrics for Gestalt perceptual organization.

    Based on Gestalt psychology principles of how the visual system
    organizes information into coherent wholes.

    Attributes:
        simplicity_score: Tendency toward simple, regular forms (0-1)
        closure_score: Degree of perceptual closure/completion (0-1)
        invariance_score: Stability under transformations (0-1)
    """

    simplicity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    closure_score: float = Field(default=0.5, ge=0.0, le=1.0)
    invariance_score: float = Field(default=0.5, ge=0.0, le=1.0)

    def compute_gestalt_strength(self) -> float:
        """Compute overall Gestalt organization strength.

        Returns:
            Overall Gestalt strength (0-1)
        """
        # Equal weighting of all three principles
        return (self.simplicity_score + self.closure_score + self.invariance_score) / 3.0
