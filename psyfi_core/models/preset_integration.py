"""
PsyFi Preset Integration Module
Applied Alchemy Labs
ABX-Core v1.3 Compliant

This module integrates substance presets with PsyFi consciousness field engines.
Includes safety defaults and parameter mapping logic.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
import numpy as np

from psyfi_core.abx_core.runtime import ABXRuntime
from psyfi_core.models.substance_preset import SubstancePreset, load_preset


# ============================================================
# SAFETY DEFAULTS
# ============================================================

class SafetyDefaults:
    """Safety constraints for preset parameters."""

    # Valence bounds
    VALENCE_FLOOR = -0.95  # Prevent complete dysphoria
    VALENCE_CEILING = 1.0

    # Phase dynamics ceilings
    PHASE_NOISE_MAX = 0.95
    PHASE_RESET_MAX = 0.98
    DRIFT_AMPLITUDE_MAX = 0.98
    DRIFT_VELOCITY_MAX = 0.95

    # Normalization bounds
    NORMALIZATION_P_MIN = 1.0
    NORMALIZATION_P_MAX = 3.0
    NORMALIZATION_V_MIN = 0.0
    NORMALIZATION_V_MAX = 1.0

    # Coupling bounds
    COUPLING_STRENGTH_MIN = 0.0
    COUPLING_STRENGTH_MAX = 2.0

    # Intensity bounds
    INTENSITY_MIN = 0.0
    INTENSITY_MAX = 1.0

    # Negativity clamp (for negative valence scenarios)
    NEGATIVE_VALENCE_CLAMP = -0.90  # Hard limit for deliriants

    @staticmethod
    def clamp_valence(value: float) -> float:
        """Clamp valence to safe bounds."""
        return np.clip(value, SafetyDefaults.VALENCE_FLOOR, SafetyDefaults.VALENCE_CEILING)

    @staticmethod
    def clamp_phase_noise(value: float) -> float:
        """Clamp phase noise to safe bounds."""
        return np.clip(value, 0.0, SafetyDefaults.PHASE_NOISE_MAX)

    @staticmethod
    def clamp_drift_amplitude(value: float) -> float:
        """Clamp drift amplitude to safe bounds."""
        return np.clip(value, 0.0, SafetyDefaults.DRIFT_AMPLITUDE_MAX)

    @staticmethod
    def clamp_drift_velocity(value: float) -> float:
        """Clamp drift velocity to safe bounds."""
        return np.clip(value, 0.0, SafetyDefaults.DRIFT_VELOCITY_MAX)

    @staticmethod
    def clamp_normalization_P(value: float) -> float:
        """Clamp normalization exponent P."""
        return np.clip(value, SafetyDefaults.NORMALIZATION_P_MIN, SafetyDefaults.NORMALIZATION_P_MAX)

    @staticmethod
    def clamp_normalization_V(value: float) -> float:
        """Clamp normalization surround weight V."""
        return np.clip(value, SafetyDefaults.NORMALIZATION_V_MIN, SafetyDefaults.NORMALIZATION_V_MAX)

    @staticmethod
    def enforce_boundary_integrity(params: Dict[str, Any]) -> Dict[str, Any]:
        """Enforce all safety boundaries on parameters."""
        safe_params = params.copy()

        # Clamp all phase dynamics
        if "phase_noise" in safe_params:
            safe_params["phase_noise"] = SafetyDefaults.clamp_phase_noise(safe_params["phase_noise"])

        if "phase_reset_strength" in safe_params:
            safe_params["phase_reset_strength"] = np.clip(
                safe_params["phase_reset_strength"], 0.0, SafetyDefaults.PHASE_RESET_MAX
            )

        if "drift_amplitude" in safe_params:
            safe_params["drift_amplitude"] = SafetyDefaults.clamp_drift_amplitude(safe_params["drift_amplitude"])

        if "drift_velocity" in safe_params:
            safe_params["drift_velocity"] = SafetyDefaults.clamp_drift_velocity(safe_params["drift_velocity"])

        # Clamp normalization
        if "normalization_P" in safe_params:
            safe_params["normalization_P"] = SafetyDefaults.clamp_normalization_P(safe_params["normalization_P"])

        if "normalization_V" in safe_params:
            safe_params["normalization_V"] = SafetyDefaults.clamp_normalization_V(safe_params["normalization_V"])

        # Clamp coupling
        if "coupling_strength" in safe_params:
            safe_params["coupling_strength"] = np.clip(
                safe_params["coupling_strength"],
                SafetyDefaults.COUPLING_STRENGTH_MIN,
                SafetyDefaults.COUPLING_STRENGTH_MAX
            )

        return safe_params


# ============================================================
# RECEPTOR-TO-PARAMETER MAPPING
# ============================================================

def receptor_to_param_map(preset: SubstancePreset) -> Dict[str, float]:
    """
    Map receptor binding profiles to PsyFi parameters.

    This function translates pharmacological receptor binding
    into phenomenological field dynamics parameters.

    Args:
        preset: SubstancePreset object

    Returns:
        Dictionary of computed modulation factors
    """
    mechanism = preset.mechanism
    mapping = {}

    # 5-HT2A → Visual dynamics
    mapping["5ht2a_to_phase_noise"] = mechanism.ht2a_5 * 0.50
    mapping["5ht2a_to_symmetry"] = mechanism.ht2a_5 * 0.95
    mapping["5ht2a_to_pattern_complexity"] = mechanism.ht2a_5 * 0.90

    # 5-HT1A → Emotional tone
    mapping["5ht1a_to_valence"] = mechanism.ht1a_5 * 0.70
    mapping["5ht1a_to_ego_dissolution"] = mechanism.ht1a_5 * 0.60

    # NMDA antagonism → Dissociation
    mapping["nmda_to_dissociation"] = (1.0 - mechanism.nmda) if mechanism.nmda > 0 else 0.0
    mapping["nmda_to_depth_distortion"] = mapping["nmda_to_dissociation"] * 0.85

    # Sigma-1 → Depth perception alterations
    mapping["sigma1_to_depth_distortion"] = mechanism.sigma1 * 0.75

    # Dopamine → Arousal/motivation
    mapping["dopamine_to_arousal"] = mechanism.dopamine * 0.80
    mapping["dopamine_to_focus"] = mechanism.dopamine * 0.70

    # Serotonin → Empathy/mood
    mapping["serotonin_to_empathy"] = mechanism.serotonin * 0.85
    mapping["serotonin_to_valence"] = mechanism.serotonin * 0.60

    # Norepinephrine → Arousal/alertness
    mapping["norepinephrine_to_arousal"] = mechanism.norepinephrine * 0.75

    # GABA → Calming
    mapping["gaba_to_calming"] = mechanism.gaba * 0.60

    # Acetylcholine antagonism → Delirium
    mapping["acetylcholine_to_delirium"] = (1.0 - mechanism.acetylcholine) if mechanism.acetylcholine > 0 else 0.0
    mapping["acetylcholine_to_dysphoria"] = mapping["acetylcholine_to_delirium"] * 0.80

    return mapping


def normalization_update(
    preset: SubstancePreset,
    base_P: float = 2.0,
    base_V: float = 0.5
) -> tuple[float, float]:
    """
    Compute updated divisive normalization parameters based on preset.

    Args:
        preset: SubstancePreset object
        base_P: Base exponent
        base_V: Base surround weight

    Returns:
        Tuple of (P, V) for normalization
    """
    P = preset.psyfi_params.normalization.P
    V = preset.psyfi_params.normalization.V

    # Apply safety clamping
    P = SafetyDefaults.clamp_normalization_P(P)
    V = SafetyDefaults.clamp_normalization_V(V)

    return P, V


# ============================================================
# PRESET APPLICATION
# ============================================================

def apply_preset(
    preset_name: str,
    base_params: Optional[Dict[str, Any]] = None,
    intensity: float = 1.0,
    safety_clamp: bool = True,
    runtime: Optional[ABXRuntime] = None
) -> Dict[str, Any]:
    """
    Apply a substance preset to PsyFi parameters.

    Args:
        preset_name: Name or alias of preset
        base_params: Base parameter dictionary (default: baseline)
        intensity: Effect intensity multiplier (0-1)
        safety_clamp: Whether to enforce safety limits
        runtime: ABXRuntime for provenance tracking

    Returns:
        Updated parameter dictionary with preset applied

    Raises:
        ValueError: If preset not found
    """
    # Load preset
    preset = load_preset(preset_name)
    if preset is None:
        raise ValueError(f"Preset '{preset_name}' not found")

    # Initialize base params if not provided
    if base_params is None:
        base_params = {
            "normalization_P": 2.0,
            "normalization_V": 0.5,
            "phase_noise": 0.0,
            "phase_reset_strength": 0.0,
            "drift_amplitude": 0.0,
            "drift_velocity": 0.0,
            "coupling_strength": 0.3,
        }

    # Clamp intensity
    if safety_clamp:
        intensity = np.clip(intensity, SafetyDefaults.INTENSITY_MIN, SafetyDefaults.INTENSITY_MAX)

    # Apply preset modifications
    params = preset.apply_to_params(base_params, intensity=intensity, safety_clamp=safety_clamp)

    # Enforce boundary integrity
    if safety_clamp:
        params = SafetyDefaults.enforce_boundary_integrity(params)

    # Track provenance
    if runtime is not None:
        runtime.provenance.add_event(
            f"Applied preset '{preset.name}' at intensity {intensity:.2f}"
        )

    return params


def get_field_dynamics_config(
    preset: SubstancePreset,
    intensity: float = 1.0,
    safety_clamp: bool = True
) -> Dict[str, Any]:
    """
    Get complete field dynamics configuration from preset.

    Args:
        preset: SubstancePreset object
        intensity: Effect intensity (0-1)
        safety_clamp: Whether to enforce safety limits

    Returns:
        Complete configuration dictionary for field engines
    """
    if safety_clamp:
        intensity = np.clip(intensity, SafetyDefaults.INTENSITY_MIN, SafetyDefaults.INTENSITY_MAX)

    config = {
        # Normalization
        "normalization": {
            "P": preset.psyfi_params.normalization.P,
            "V": preset.psyfi_params.normalization.V,
        },

        # Phase dynamics
        "phase": {
            "noise": preset.psyfi_params.phase_noise * intensity,
            "reset_strength": preset.psyfi_params.phase_reset_strength * intensity,
        },

        # Drift dynamics
        "drift": {
            "amplitude": preset.psyfi_params.drift_amplitude * intensity,
            "velocity": preset.psyfi_params.drift_velocity * intensity,
        },

        # Coupling
        "coupling": {
            "strength": preset.psyfi_params.coupling_strength,
        },

        # Visual signature
        "visual": {
            "tracer_length": preset.visual_signature.tracers_length,
            "tracer_color": preset.visual_signature.tracers_color,
            "oscillation_style": preset.visual_signature.oscillation_style,
            "symmetry_bias": preset.visual_signature.symmetry_bias,
            "depth_distortion": preset.visual_signature.depth_distortion,
        },

        # Emotional signature
        "emotional": {
            "valence_bias": SafetyDefaults.clamp_valence(preset.emotional_signature.valence_bias),
            "arousal_level": preset.emotional_signature.arousal_level,
            "empathy_gain": preset.emotional_signature.empathy_gain,
            "ego_softening": preset.emotional_signature.ego_boundary_softening,
        },
    }

    # Apply safety clamping
    if safety_clamp:
        config["phase"]["noise"] = SafetyDefaults.clamp_phase_noise(config["phase"]["noise"])
        config["drift"]["amplitude"] = SafetyDefaults.clamp_drift_amplitude(config["drift"]["amplitude"])
        config["drift"]["velocity"] = SafetyDefaults.clamp_drift_velocity(config["drift"]["velocity"])

    return config


# Example usage
if __name__ == "__main__":
    # Apply a preset
    params = apply_preset("lsd", intensity=0.7, safety_clamp=True)
    print("LSD preset at 70% intensity:")
    for key, value in params.items():
        print(f"  {key}: {value:.4f}")

    # Get full configuration
    lsd_preset = load_preset("lsd")
    if lsd_preset:
        config = get_field_dynamics_config(lsd_preset, intensity=0.8)
        print("\nFull field dynamics configuration:")
        import json
        print(json.dumps(config, indent=2))
