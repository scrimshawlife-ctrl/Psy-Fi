"""ABX-Core runtime metrics tracking."""

from dataclasses import dataclass, field


@dataclass
class ABXMetrics:
    """Tracks computational metrics during runtime execution.

    Attributes:
        compute_steps: Total number of compute steps executed
        grid_size: Size of the computational grid (width * height)
        entropy_proxy: Approximate measure of system entropy/complexity
        extras: Dictionary for additional custom metrics
    """

    compute_steps: int = 0
    grid_size: int = 0
    entropy_proxy: float = 0.0
    extras: dict = field(default_factory=dict)

    def increment_steps(self, count: int = 1) -> None:
        """Increment the compute step counter."""
        self.compute_steps += count

    def set_grid_size(self, width: int, height: int) -> None:
        """Set the grid size from width and height."""
        self.grid_size = width * height

    def update_entropy(self, value: float) -> None:
        """Update the entropy proxy value."""
        self.entropy_proxy = value

    def add_extra(self, key: str, value: float | int | str) -> None:
        """Add an extra metric."""
        self.extras[key] = value
