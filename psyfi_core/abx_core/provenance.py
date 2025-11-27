"""ABX-Core provenance tracking for reproducibility."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ProvenanceRecord:
    """Tracks the execution provenance for reproducibility.

    Attributes:
        timestamp: When the execution started
        seed: Random seed used for deterministic execution
        module_chain: List of module names that have been executed
        parameters: Dictionary of parameters used across modules
        meta: Additional metadata
    """

    timestamp: datetime = field(default_factory=datetime.now)
    seed: int | None = None
    module_chain: list[str] = field(default_factory=list)
    parameters: dict[str, Any] = field(default_factory=dict)
    meta: dict[str, Any] = field(default_factory=dict)

    def add_module(self, module_name: str) -> None:
        """Add a module to the execution chain."""
        self.module_chain.append(module_name)

    def add_parameter(self, key: str, value: Any) -> None:
        """Add a parameter to the provenance record."""
        self.parameters[key] = value

    def add_meta(self, key: str, value: Any) -> None:
        """Add metadata to the provenance record."""
        self.meta[key] = value

    def clone_with_meta(self, extra_meta: dict[str, Any]) -> "ProvenanceRecord":
        """Clone this record with additional metadata.

        Args:
            extra_meta: Additional metadata to merge

        Returns:
            New ProvenanceRecord with merged metadata
        """
        new_record = ProvenanceRecord(
            timestamp=self.timestamp,
            seed=self.seed,
            module_chain=self.module_chain.copy(),
            parameters=self.parameters.copy(),
            meta={**self.meta, **extra_meta},
        )
        return new_record
