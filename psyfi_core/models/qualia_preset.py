"""Qualia preset - psychoactive substance and state configuration."""

from typing import Literal

from pydantic import BaseModel, Field


class QualiaPreset(BaseModel):
    """Configuration for psychoactive substance effects.

    Attributes:
        name: Name of the preset
        substance: The substance being modeled
        state: Current phase of the experience
        description: Human-readable description
    """

    name: str = Field(min_length=1)
    substance: Literal["LSD", "DMT", "psilocybin", "baseline"] = Field(default="baseline")
    state: Literal["comeup", "peak", "afterglow", "baseline"] = Field(default="baseline")
    description: str = Field(default="")

    @classmethod
    def baseline(cls) -> "QualiaPreset":
        """Create a baseline (sober) preset.

        Returns:
            QualiaPreset for baseline consciousness
        """
        return cls(
            name="Baseline",
            substance="baseline",
            state="baseline",
            description="Normal waking consciousness",
        )

    @classmethod
    def lsd_peak(cls) -> "QualiaPreset":
        """Create an LSD peak experience preset.

        Returns:
            QualiaPreset for LSD peak
        """
        return cls(
            name="LSD Peak",
            substance="LSD",
            state="peak",
            description="Peak LSD experience with enhanced pattern recognition",
        )

    @classmethod
    def psilocybin_peak(cls) -> "QualiaPreset":
        """Create a psilocybin peak experience preset.

        Returns:
            QualiaPreset for psilocybin peak
        """
        return cls(
            name="Psilocybin Peak",
            substance="psilocybin",
            state="peak",
            description="Peak psilocybin experience with emotional depth",
        )

    @classmethod
    def dmt_peak(cls) -> "QualiaPreset":
        """Create a DMT breakthrough preset.

        Returns:
            QualiaPreset for DMT peak
        """
        return cls(
            name="DMT Breakthrough",
            substance="DMT",
            state="peak",
            description="DMT breakthrough with reality dissolution",
        )
