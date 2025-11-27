"""PsyFi consciousness field engines - modular processing components."""

# Ontology, binding, and ethics
from psyfi_core.engines.ontology_omega import OntologyConfig
from psyfi_core.engines.boundary_theta import compute_binding_segments
from psyfi_core.engines.ethics_sigma import EthicsAssessment, assess_ethics

# Oscillatory field effects
from psyfi_core.engines.echo_tau import EchoTauParams, apply_echo_tau
from psyfi_core.engines.gradient_delta import GradientDeltaParams, apply_gradient_delta
from psyfi_core.engines.archetype_phi import ArchetypePhiParams, apply_archetype_phi

# Core consciousness field evolution
from psyfi_core.engines.consciousness_omega import (
    ConsciousnessOmegaParams,
    evolve_consciousness_omega,
)

# Visual geometry
from psyfi_core.engines.retina_lambda import RetinaLambdaParams, apply_log_polar_geometry

# Valence assessment
from psyfi_core.engines.valence_kappa import compute_valence_metrics
from psyfi_core.engines.pain_omega import compute_negative_valence_signature

# Psychedelic modulation
from psyfi_core.engines.reset_psi import apply_phase_reset
from psyfi_core.engines.normalization_nu import NormalizationParams, apply_normalization
from psyfi_core.engines.receptor_mu import apply_receptor_modulation
from psyfi_core.engines.psychedelic_delta import apply_psychedelic_context_shift

# Meditative modulation
from psyfi_core.engines.jhana_omega import JhanaOmegaParams, apply_jhana_absorption
from psyfi_core.engines.topology_tau import TopologyTauParams, apply_topological_smoothing
from psyfi_core.engines.attention_phi import AttentionPhiParams, apply_attention_modulation

# Gestalt and geometry
from psyfi_core.engines.gestalt_gamma import GestaltGammaParams, apply_gestalt_completion
from psyfi_core.engines.resonance_chi import compute_resonance_modes
from psyfi_core.engines.geometry_lambda import compute_simplicity_metrics

__all__ = [
    # Ontology, binding, ethics
    "OntologyConfig",
    "compute_binding_segments",
    "EthicsAssessment",
    "assess_ethics",
    # Oscillatory
    "EchoTauParams",
    "apply_echo_tau",
    "GradientDeltaParams",
    "apply_gradient_delta",
    "ArchetypePhiParams",
    "apply_archetype_phi",
    # Consciousness evolution
    "ConsciousnessOmegaParams",
    "evolve_consciousness_omega",
    # Visual geometry
    "RetinaLambdaParams",
    "apply_log_polar_geometry",
    # Valence
    "compute_valence_metrics",
    "compute_negative_valence_signature",
    # Psychedelic
    "apply_phase_reset",
    "NormalizationParams",
    "apply_normalization",
    "apply_receptor_modulation",
    "apply_psychedelic_context_shift",
    # Meditative
    "JhanaOmegaParams",
    "apply_jhana_absorption",
    "TopologyTauParams",
    "apply_topological_smoothing",
    "AttentionPhiParams",
    "apply_attention_modulation",
    # Gestalt
    "GestaltGammaParams",
    "apply_gestalt_completion",
    "compute_resonance_modes",
    "compute_simplicity_metrics",
]
