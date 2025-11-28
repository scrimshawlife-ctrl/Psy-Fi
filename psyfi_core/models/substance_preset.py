"""
PsyFi Substance Preset Models
Applied Alchemy Labs
ABX-Core v1.3 Compliant

This module provides Pydantic models for substance presets and a loader/registry system.
All presets are for research and simulation purposes only.
"""

from __future__ import annotations

from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import json
from pydantic import BaseModel, Field, field_validator


class SubstanceClass(str, Enum):
    """Pharmacological classes for substances."""
    CLASSIC_PSYCHEDELIC = "classic_psychedelic"
    EMPATHOGEN = "empathogen"
    DISSOCIATIVE = "dissociative"
    DELIRIANT = "deliriant"
    STIMULANT = "stimulant"
    BASELINE = "baseline"
    MEDITATIVE = "meditative"


class OscillationStyle(str, Enum):
    """Visual oscillation patterns."""
    SMOOTH = "smooth"
    GEOMETRIC = "geometric"
    ORGANIC = "organic"
    CRYSTALLINE = "crystalline"
    FRACTAL = "fractal"
    MINIMAL = "minimal"


class ReceptorMechanism(BaseModel):
    """Receptor binding profile (normalized 0-1 scale)."""
    ht2a_5: float = Field(0.0, alias="5ht2a", ge=0.0, le=1.0)
    ht1a_5: float = Field(0.0, alias="5ht1a", ge=0.0, le=1.0)
    sigma1: float = Field(0.0, ge=0.0, le=1.0)
    nmda: float = Field(0.0, ge=0.0, le=1.0)
    gaba: float = Field(0.0, ge=0.0, le=1.0)
    dopamine: float = Field(0.0, ge=0.0, le=1.0)
    serotonin: float = Field(0.0, ge=0.0, le=1.0)
    norepinephrine: float = Field(0.0, ge=0.0, le=1.0)
    acetylcholine: float = Field(0.0, ge=0.0, le=1.0)

    class Config:
        populate_by_name = True


class VisualSignature(BaseModel):
    """Visual phenomenology parameters."""
    tracers_color: str
    tracers_length: float = Field(ge=0.0, le=1.0)
    oscillation_style: OscillationStyle
    symmetry_bias: float = Field(ge=0.0, le=1.0)
    depth_distortion: float = Field(ge=0.0, le=1.0)
    color_enhancement: float = Field(ge=0.0, le=1.0)
    pattern_complexity: float = Field(ge=0.0, le=1.0)


class EmotionalSignature(BaseModel):
    """Affective and cognitive parameters."""
    valence_bias: float = Field(ge=-1.0, le=1.0)
    arousal_level: float = Field(ge=-1.0, le=1.0)
    anxiety_tendency: float = Field(ge=0.0, le=1.0)
    empathy_gain: float = Field(ge=0.0, le=1.0)
    ego_boundary_softening: float = Field(ge=0.0, le=1.0)
    thought_coherence: float = Field(ge=0.0, le=1.0)


class PhaseInfo(BaseModel):
    """Temporal phase information."""
    duration_minutes: float = Field(ge=0.0)
    intensity_curve: Optional[str] = None
    intensity_multiplier: Optional[float] = Field(default=1.0, ge=0.0)


class StatePhases(BaseModel):
    """Temporal dynamics of effects."""
    comeup: PhaseInfo
    peak: PhaseInfo
    plateau: Optional[PhaseInfo] = None
    comedown: PhaseInfo


class Normalization(BaseModel):
    """Divisive normalization parameters."""
    P: float = Field(description="Exponent for divisive normalization", ge=0.5, le=3.0)
    V: float = Field(description="Surround weight", ge=0.0, le=1.0)


class PsyFiParams(BaseModel):
    """PsyFi-specific field dynamics parameters."""
    normalization: Normalization
    phase_noise: float = Field(ge=0.0, le=1.0)
    phase_reset_strength: float = Field(ge=0.0, le=1.0)
    drift_amplitude: float = Field(ge=0.0, le=1.0)
    drift_velocity: float = Field(ge=0.0, le=1.0)
    coupling_strength: float = Field(ge=0.0, le=2.0)
    receptor_modulation_map: Dict[str, float] = Field(default_factory=dict)


class SubstancePreset(BaseModel):
    """Complete substance preset model."""
    name: str
    aliases: List[str] = Field(default_factory=list)
    substance_class: SubstanceClass = Field(alias="class")
    mechanism: ReceptorMechanism
    visual_signature: VisualSignature
    emotional_signature: EmotionalSignature
    state_phases: StatePhases
    psyfi_params: PsyFiParams

    class Config:
        populate_by_name = True

    def get_total_duration_minutes(self) -> float:
        """Calculate total effect duration."""
        total = self.state_phases.comeup.duration_minutes
        total += self.state_phases.peak.duration_minutes
        if self.state_phases.plateau:
            total += self.state_phases.plateau.duration_minutes
        total += self.state_phases.comedown.duration_minutes
        return total

    def apply_to_params(
        self,
        base_params: Dict[str, Any],
        intensity: float = 1.0,
        safety_clamp: bool = True
    ) -> Dict[str, Any]:
        """
        Apply this preset to base PsyFi parameters.

        Args:
            base_params: Base parameter dictionary
            intensity: Intensity multiplier (0-1)
            safety_clamp: Whether to enforce safety limits

        Returns:
            Modified parameter dictionary
        """
        params = base_params.copy()

        # Clamp intensity
        if safety_clamp:
            intensity = max(0.0, min(1.0, intensity))

        # Apply normalization
        params["normalization_P"] = self.psyfi_params.normalization.P
        params["normalization_V"] = self.psyfi_params.normalization.V

        # Apply field dynamics
        params["phase_noise"] = self.psyfi_params.phase_noise * intensity
        params["phase_reset_strength"] = self.psyfi_params.phase_reset_strength * intensity
        params["drift_amplitude"] = self.psyfi_params.drift_amplitude * intensity
        params["drift_velocity"] = self.psyfi_params.drift_velocity * intensity
        params["coupling_strength"] = self.psyfi_params.coupling_strength

        # Apply safety clamping
        if safety_clamp:
            params["phase_noise"] = min(params["phase_noise"], 0.95)
            params["drift_amplitude"] = min(params["drift_amplitude"], 0.98)
            params["drift_velocity"] = min(params["drift_velocity"], 0.95)

        return params


class PresetRegistry:
    """Registry for loading and managing substance presets."""

    def __init__(self, presets_path: Optional[Path] = None):
        """Initialize the registry."""
        if presets_path is None:
            presets_path = Path(__file__).parent.parent / "presets" / "substance_presets.json"

        self.presets_path = presets_path
        self._presets: Dict[str, SubstancePreset] = {}
        self._aliases: Dict[str, str] = {}
        self.metadata: Dict[str, Any] = {}

    def load_presets(self) -> None:
        """Load all presets from JSON file."""
        if not self.presets_path.exists():
            raise FileNotFoundError(f"Presets file not found: {self.presets_path}")

        with open(self.presets_path, 'r') as f:
            data = json.load(f)

        self.metadata = data.get("metadata", {})
        presets_data = data.get("presets", {})

        for key, preset_data in presets_data.items():
            preset = SubstancePreset(**preset_data)
            self._presets[key] = preset

            # Register aliases
            for alias in preset.aliases:
                self._aliases[alias.lower()] = key

    def get(self, name: str) -> Optional[SubstancePreset]:
        """Get a preset by name or alias."""
        if not self._presets:
            self.load_presets()

        # Try direct lookup
        if name in self._presets:
            return self._presets[name]

        # Try alias lookup
        name_lower = name.lower()
        if name_lower in self._aliases:
            return self._presets[self._aliases[name_lower]]

        return None

    def list_presets(self) -> List[str]:
        """List all available preset names."""
        if not self._presets:
            self.load_presets()
        return list(self._presets.keys())

    def list_by_class(self, substance_class: SubstanceClass) -> List[str]:
        """List all presets of a specific class."""
        if not self._presets:
            self.load_presets()
        return [
            key for key, preset in self._presets.items()
            if preset.substance_class == substance_class
        ]

    def get_all(self) -> Dict[str, SubstancePreset]:
        """Get all presets."""
        if not self._presets:
            self.load_presets()
        return self._presets.copy()


# Global registry instance
_global_registry: Optional[PresetRegistry] = None


def get_registry() -> PresetRegistry:
    """Get the global preset registry (singleton)."""
    global _global_registry
    if _global_registry is None:
        _global_registry = PresetRegistry()
    return _global_registry


def load_preset(name: str) -> Optional[SubstancePreset]:
    """Load a preset by name (convenience function)."""
    return get_registry().get(name)


def list_presets() -> List[str]:
    """List all available presets (convenience function)."""
    return get_registry().list_presets()


# Example usage:
if __name__ == "__main__":
    # Load a preset
    lsd = load_preset("lsd")
    if lsd:
        print(f"Loaded: {lsd.name}")
        print(f"  Class: {lsd.substance_class}")
        print(f"  5-HT2A: {lsd.mechanism.ht2a_5}")
        print(f"  Visual symmetry bias: {lsd.visual_signature.symmetry_bias}")
        print(f"  Total duration: {lsd.get_total_duration_minutes()} minutes")

    # List all presets
    print(f"\nAvailable presets: {list_presets()}")

    # List by class
    registry = get_registry()
    psychedelics = registry.list_by_class(SubstanceClass.CLASSIC_PSYCHEDELIC)
    print(f"\nClassic psychedelics: {psychedelics}")
