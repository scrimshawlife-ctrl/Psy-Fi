"""ABX-Core error types."""


class ABXError(Exception):
    """Base exception for ABX-Core runtime errors."""

    pass


class DeterminismError(ABXError):
    """Raised when deterministic execution produces non-deterministic results."""

    def __init__(self, message: str = "Determinism violation detected"):
        super().__init__(message)


class SimulationCancelled(ABXError):
    """Raised when a running simulation is cancelled by the caller."""

    def __init__(self, message: str = "Simulation cancelled"):
        super().__init__(message)
