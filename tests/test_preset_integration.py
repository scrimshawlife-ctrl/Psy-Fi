"""Tests for substance preset application and provenance."""

import pytest

from psyfi_core import ABXRuntime
from psyfi_core.engines import ConsciousnessOmegaParams
from psyfi_core.models.preset_integration import apply_preset


def test_apply_preset_records_provenance_without_crashing() -> None:
    """apply_preset should use ProvenanceRecord APIs that actually exist."""
    runtime = ABXRuntime(deterministic=True, seed=7)
    params = apply_preset("lsd", intensity=0.7, runtime=runtime)

    assert params["phase_noise"] >= 0.0
    assert runtime.provenance.module_chain == ["preset_integration"]
    assert runtime.provenance.parameters["preset_name"] == "LSD"
    assert runtime.provenance.parameters["preset_intensity"] == pytest.approx(0.7)
    assert "preset_applied" in runtime.provenance.meta


def test_dmt_coupling_is_accepted_by_consciousness_omega() -> None:
    """High-coupling substance presets must fit ConsciousnessOmegaParams bounds."""
    params = apply_preset("dmt", intensity=1.0)
    coupling = params["coupling_strength"]

    assert coupling > 1.0
    # Previously ValidationError at le=1.0; bound is now aligned with presets.
    model = ConsciousnessOmegaParams(coupling_strength=coupling)
    assert model.coupling_strength == pytest.approx(coupling)


def test_apply_preset_unknown_name_raises() -> None:
    """Unknown presets should raise a clear ValueError."""
    with pytest.raises(ValueError, match="not found"):
        apply_preset("not-a-real-preset")
