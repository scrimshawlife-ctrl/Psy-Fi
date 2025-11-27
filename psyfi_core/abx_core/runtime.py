"""ABX-Core deterministic runtime."""

from dataclasses import dataclass, field
from typing import Any

import numpy as np

from psyfi_core.abx_core.errors import DeterminismError
from psyfi_core.abx_core.metrics import ABXMetrics
from psyfi_core.abx_core.provenance import ProvenanceRecord


@dataclass
class ABXRuntime:
    """Deterministic runtime for ABX-Core v1.3.

    Manages random number generation, metrics tracking, and provenance
    recording to ensure reproducible simulations.

    Attributes:
        deterministic: Whether to enforce deterministic execution
        seed: Random seed for reproducibility
        metrics: Runtime metrics tracker
        provenance: Execution provenance record
    """

    deterministic: bool = True
    seed: int | None = None
    metrics: ABXMetrics = field(default_factory=ABXMetrics)
    provenance: ProvenanceRecord = field(default_factory=ProvenanceRecord)
    _rng: np.random.Generator = field(init=False, repr=False)

    def __post_init__(self) -> None:
        """Initialize the runtime after dataclass initialization."""
        # Set seed based on deterministic flag
        if self.seed is None:
            if self.deterministic:
                self.seed = 1337  # Default deterministic seed
            else:
                # Use random 32-bit seed for non-deterministic mode
                self.seed = np.random.randint(0, 2**32 - 1)

        # Initialize random number generator
        self._rng = np.random.default_rng(self.seed)

        # Record seed in provenance
        self.provenance.seed = self.seed
        self.provenance.add_meta("deterministic", self.deterministic)

    @property
    def rng(self) -> np.random.Generator:
        """Get the random number generator.

        Returns:
            NumPy random Generator instance
        """
        return self._rng

    def fork(self, extra_meta: dict[str, Any] | None = None) -> "ABXRuntime":
        """Fork this runtime with the same seed and extended provenance.

        Args:
            extra_meta: Additional metadata to add to the forked runtime's provenance

        Returns:
            New ABXRuntime with same seed and extended metadata
        """
        extra_meta = extra_meta or {}

        # Create new provenance with extra metadata
        new_provenance = self.provenance.clone_with_meta(extra_meta)

        # Create new runtime with same configuration
        new_runtime = ABXRuntime(
            deterministic=self.deterministic,
            seed=self.seed,
            metrics=ABXMetrics(),  # Fresh metrics
            provenance=new_provenance,
        )

        return new_runtime

    def verify_determinism(self, hash_a: int, hash_b: int) -> None:
        """Verify that two hash values match when in deterministic mode.

        Args:
            hash_a: First hash value
            hash_b: Second hash value

        Raises:
            DeterminismError: If hashes don't match in deterministic mode
        """
        if self.deterministic and hash_a != hash_b:
            raise DeterminismError(
                f"Hash mismatch in deterministic mode: {hash_a} != {hash_b}"
            )
