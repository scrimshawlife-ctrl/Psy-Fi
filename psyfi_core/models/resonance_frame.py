"""Resonance frame - the core 2D complex field representation."""

from typing import Literal

import numpy as np
from pydantic import BaseModel, Field, field_validator


class ResonanceFrame(BaseModel):
    """A 2D complex field representing consciousness state.

    The field is stored as a complex64 numpy array where:
    - Magnitude represents activation/intensity
    - Phase represents the oscillatory state

    Attributes:
        width: Width of the field
        height: Height of the field
        color_mode: How to interpret the field for visualization
        field: The 2D complex field array (height, width)
        metadata: Additional metadata about this frame
    """

    width: int = Field(gt=0)
    height: int = Field(gt=0)
    color_mode: Literal["phase", "magnitude", "dual"] = Field(default="phase")
    field: np.ndarray = Field(repr=False)
    metadata: dict = Field(default_factory=dict)

    model_config = {"arbitrary_types_allowed": True}

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: np.ndarray) -> np.ndarray:
        """Validate that field is a 2D complex array."""
        if v.dtype != np.complex64:
            raise ValueError(f"Field must be complex64, got {v.dtype}")
        if v.ndim != 2:
            raise ValueError(f"Field must be 2D, got {v.ndim}D")
        return v

    @classmethod
    def zeros(
        cls,
        width: int,
        height: int,
        color_mode: Literal["phase", "magnitude", "dual"] = "phase",
    ) -> "ResonanceFrame":
        """Create a resonance frame with a zero field.

        Args:
            width: Width of the field
            height: Height of the field
            color_mode: Color interpretation mode

        Returns:
            New ResonanceFrame with zero complex field
        """
        field = np.zeros((height, width), dtype=np.complex64)
        return cls(
            width=width,
            height=height,
            color_mode=color_mode,
            field=field,
        )

    def copy_with_field(self, new_field: np.ndarray) -> "ResonanceFrame":
        """Create a copy with a new field but same metadata.

        Args:
            new_field: New field array to use

        Returns:
            New ResonanceFrame with updated field

        Raises:
            ValueError: If new field shape doesn't match
        """
        if new_field.shape != (self.height, self.width):
            raise ValueError(
                f"Field shape {new_field.shape} doesn't match "
                f"expected ({self.height}, {self.width})"
            )

        return ResonanceFrame(
            width=self.width,
            height=self.height,
            color_mode=self.color_mode,
            field=new_field.astype(np.complex64),
            metadata=self.metadata.copy(),
        )
