"""Ontology Omega - foundational ontological commitments."""

from pydantic import BaseModel, Field


class OntologyConfig(BaseModel):
    """Ontological commitments of the PsyFi framework.

    These flags define the philosophical assumptions underlying
    the consciousness simulation.

    Attributes:
        qualia_realism: Qualia are real, not epiphenomenal
        qualia_formalism: Qualia have formal, computable structure
        non_materialist_physicalist_idealism: Consciousness is fundamental
        consciousness_is_causal: Consciousness has causal power
        oneness_ethic: All consciousness is interconnected; harm to one is harm to all
    """

    qualia_realism: bool = Field(default=True)
    qualia_formalism: bool = Field(default=True)
    non_materialist_physicalist_idealism: bool = Field(default=True)
    consciousness_is_causal: bool = Field(default=True)
    oneness_ethic: bool = Field(default=True)

    model_config = {"frozen": True}

    @classmethod
    def default(cls) -> "OntologyConfig":
        """Get the default ontology configuration.

        Returns:
            OntologyConfig with all commitments enabled
        """
        return cls()
