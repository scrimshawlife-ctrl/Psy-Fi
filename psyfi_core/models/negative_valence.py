"""Negative valence signature - markers of suffering/pathology."""

from pydantic import BaseModel, Field


class NegativeValenceSignature(BaseModel):
    """Markers that indicate potential suffering or pathological states.

    These are warning signs that the consciousness field may be
    in a distressing configuration.

    Attributes:
        hyper_sync: Excessive phase synchronization (pathological locking)
        spectral_spikiness: Sharp peaks in frequency spectrum
        gradient_energy: High spatial gradient energy (visual noise/chaos)
        attractor_stability: How trapped the system is in this state
    """

    hyper_sync: float = Field(default=0.0, ge=0.0, le=1.0)
    spectral_spikiness: float = Field(default=0.0, ge=0.0)
    gradient_energy: float = Field(default=0.0, ge=0.0)
    attractor_stability: float = Field(default=0.0, ge=0.0, le=1.0)

    def compute_suffering_risk(self) -> float:
        """Compute overall suffering risk from component markers.

        Returns:
            Suffering risk score (0 to 1)
        """
        # Combine markers with weights
        risk = (
            0.3 * self.hyper_sync
            + 0.3 * min(1.0, self.spectral_spikiness / 10.0)
            + 0.2 * min(1.0, self.gradient_energy / 5.0)
            + 0.2 * self.attractor_stability
        )
        return min(1.0, risk)
