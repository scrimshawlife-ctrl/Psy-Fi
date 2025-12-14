"""PsyFi capability implementations for the overlay server."""

from typing import Any, Dict, Tuple


def capability_ping(payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """Health check capability."""
    return True, {"pong": True, "service": "psyfi"}


def capability_echo(payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """Echo capability for testing."""
    if not isinstance(payload, dict):
        return False, {"message": "input must be an object"}
    return True, {"echo": payload}


def capability_simulate(payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """
    Run a consciousness field simulation.

    Expected payload:
    {
        "width": 64,
        "height": 64,
        "steps": 20,
        "scenario": "lsd",  # optional
        "seed": 42  # optional
    }
    """
    try:
        # Import PsyFi core components
        import numpy as np
        from psyfi_core import ABXRuntime
        from psyfi_core.models import ResonanceFrame
        from psyfi_core.engines import (
            ConsciousnessOmegaParams,
            evolve_consciousness_omega,
            compute_valence_metrics,
        )

        # Extract parameters with defaults
        width = payload.get("width", 64)
        height = payload.get("height", 64)
        steps = payload.get("steps", 20)
        seed = payload.get("seed", 42)
        scenario = payload.get("scenario", "baseline")

        # Validate parameters
        if not (8 <= width <= 512):
            return False, {"message": "width must be between 8 and 512"}
        if not (8 <= height <= 512):
            return False, {"message": "height must be between 8 and 512"}
        if not (1 <= steps <= 1000):
            return False, {"message": "steps must be between 1 and 1000"}

        # Initialize deterministic runtime
        runtime = ABXRuntime(deterministic=True, seed=seed)

        # Create consciousness field
        frame = ResonanceFrame.zeros(width, height)
        phases = runtime.rng.uniform(-np.pi, np.pi, size=(height, width))
        field = np.exp(1j * phases).astype(np.complex64)
        frame = frame.copy_with_field(field)

        # Evolve the field
        params = ConsciousnessOmegaParams(coupling_strength=0.5, steps=steps)
        evolved = evolve_consciousness_omega(frame.field, params, runtime)

        # Compute metrics
        metrics = compute_valence_metrics(evolved)

        # Extract magnitude for visualization
        magnitude = np.abs(evolved).tolist()

        # Return results
        return True, {
            "width": width,
            "height": height,
            "steps": steps,
            "scenario": scenario,
            "seed": seed,
            "valence": float(metrics.valence_score),
            "coherence": float(metrics.coherence_score),
            "symmetry": float(metrics.symmetry_score),
            "roughness": float(metrics.roughness_score),
            "richness": float(metrics.richness_score),
            "magnitude": magnitude,
        }
    except Exception as e:
        return False, {"message": f"simulation error: {str(e)}"}


def capability_list_presets(payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """List available substance presets."""
    try:
        import json
        from pathlib import Path

        # Load substance presets
        presets_path = Path(__file__).parent.parent / "psyfi_core" / "presets" / "substance_presets.json"
        with open(presets_path) as f:
            data = json.load(f)

        presets = []
        for key, preset in data.get("presets", {}).items():
            presets.append({
                "id": key,
                "name": preset.get("name"),
                "class": preset.get("class"),
                "aliases": preset.get("aliases", []),
            })

        return True, {"presets": presets, "count": len(presets)}
    except Exception as e:
        return False, {"message": f"error loading presets: {str(e)}"}


def capability_list_engines(payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """List available consciousness field engines."""
    try:
        from pathlib import Path

        engines_dir = Path(__file__).parent.parent / "psyfi_core" / "engines"
        engines = []

        for engine_file in engines_dir.glob("*.py"):
            if engine_file.name != "__init__.py":
                name = engine_file.stem
                engines.append({
                    "id": name,
                    "name": name.replace("_", " ").title(),
                })

        return True, {"engines": engines, "count": len(engines)}
    except Exception as e:
        return False, {"message": f"error loading engines: {str(e)}"}


# Capability registry
CAPABILITIES = {
    "psyfi.ping": capability_ping,
    "psyfi.echo": capability_echo,
    "psyfi.simulate": capability_simulate,
    "psyfi.list_presets": capability_list_presets,
    "psyfi.list_engines": capability_list_engines,
}


def route_capability(capability: str, payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
    """Route a capability request to the appropriate handler."""
    handler = CAPABILITIES.get(capability)
    if handler is None:
        return False, {"message": f"unknown capability: {capability}"}
    return handler(payload)
