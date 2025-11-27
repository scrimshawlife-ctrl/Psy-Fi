"""Receptor profile - models neurotransmitter receptor densities."""

from pydantic import BaseModel, Field


class ReceptorProfile(BaseModel):
    """Models receptor densities for different neurotransmitter systems.

    These influence normalization and coupling parameters in the field.

    Attributes:
        h5ht2a_density: 5-HT2A serotonin receptor density
        gaba_density: GABA receptor density
        dopamine_density: Dopamine receptor density
        sigma1_density: Sigma-1 receptor density
    """

    h5ht2a_density: float = Field(default=1.0, ge=0.0)
    gaba_density: float = Field(default=1.0, ge=0.0)
    dopamine_density: float = Field(default=1.0, ge=0.0)
    sigma1_density: float = Field(default=1.0, ge=0.0)

    @classmethod
    def baseline(cls) -> "ReceptorProfile":
        """Create a baseline receptor profile with normal densities.

        Returns:
            ReceptorProfile with all densities at 1.0
        """
        return cls(
            h5ht2a_density=1.0,
            gaba_density=1.0,
            dopamine_density=1.0,
            sigma1_density=1.0,
        )

    @classmethod
    def psychedelic_agonist(cls) -> "ReceptorProfile":
        """Create a profile simulating 5-HT2A agonism (psychedelic state).

        Returns:
            ReceptorProfile with elevated 5-HT2A activity
        """
        return cls(
            h5ht2a_density=3.0,  # Elevated 5-HT2A activation
            gaba_density=0.8,  # Slightly reduced inhibition
            dopamine_density=1.2,  # Slightly elevated
            sigma1_density=1.5,  # Moderate elevation
        )
