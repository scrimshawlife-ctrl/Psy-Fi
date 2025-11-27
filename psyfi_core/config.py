"""PsyFi configuration with ABX-Core v1.3 integration."""

from pydantic import BaseModel, Field


class ABXCoreConfig(BaseModel):
    """ABX-Core v1.3 configuration.

    Attributes:
        version: ABX-Core version string
        deterministic: Whether to enforce deterministic execution
        default_seed: Default random seed for deterministic mode
        track_provenance: Whether to track execution provenance
        track_metrics: Whether to track runtime metrics
    """

    version: str = Field(default="1.3", frozen=True)
    deterministic: bool = Field(default=True)
    default_seed: int = Field(default=1337)
    track_provenance: bool = Field(default=True)
    track_metrics: bool = Field(default=True)

    model_config = {"frozen": True}


class PsyFiConfig(BaseModel):
    """Main PsyFi configuration.

    Attributes:
        abx: ABX-Core configuration
        default_width: Default width for resonance frames
        default_height: Default height for resonance frames
        max_grid_size: Maximum allowed grid size (width * height)
    """

    abx: ABXCoreConfig = Field(default_factory=ABXCoreConfig)
    default_width: int = Field(default=64)
    default_height: int = Field(default=64)
    max_grid_size: int = Field(default=1024 * 1024)

    model_config = {"frozen": True}

    def validate_grid_size(self, width: int, height: int) -> None:
        """Validate that grid size is within limits.

        Args:
            width: Grid width
            height: Grid height

        Raises:
            ValueError: If grid size exceeds maximum
        """
        grid_size = width * height
        if grid_size > self.max_grid_size:
            raise ValueError(
                f"Grid size {grid_size} exceeds maximum {self.max_grid_size}"
            )
