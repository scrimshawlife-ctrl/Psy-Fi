"""Immutable parameter-field mapping for PsyFi visual experiences."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from typing import Any, Iterable

SCHEMA_VERSION = "1.0.0"

MODE_BIASES: dict[str, dict[str, float]] = {
    "open": {
        "symmetry_order": 0.0,
        "feedback_strength": 0.0,
        "recursion_gain": 0.0,
        "turbulence": 0.05,
        "trail_length": 0.0,
        "edge_gain": 0.0,
        "zoom_velocity": 0.0,
        "displacement": 0.0,
        "stability": 0.0,
        "entropy": 0.05,
        "void_bias": 0.0,
        "attractor_bias": 0.0,
        "power_bias": 0.0,
    },
    "attractor": {
        "symmetry_order": 0.25,
        "feedback_strength": 0.12,
        "recursion_gain": 0.08,
        "turbulence": -0.12,
        "trail_length": 0.1,
        "edge_gain": 0.18,
        "zoom_velocity": -0.05,
        "displacement": -0.08,
        "stability": 0.2,
        "entropy": -0.1,
        "void_bias": 0.0,
        "attractor_bias": 0.85,
        "power_bias": 0.0,
    },
    "void": {
        "symmetry_order": -0.15,
        "feedback_strength": -0.05,
        "recursion_gain": 0.05,
        "turbulence": -0.05,
        "trail_length": -0.1,
        "edge_gain": -0.2,
        "zoom_velocity": 0.18,
        "displacement": 0.05,
        "stability": -0.05,
        "entropy": 0.1,
        "void_bias": 0.9,
        "attractor_bias": 0.0,
        "power_bias": 0.0,
    },
    "power": {
        "symmetry_order": 0.1,
        "feedback_strength": 0.22,
        "recursion_gain": 0.25,
        "turbulence": 0.2,
        "trail_length": 0.15,
        "edge_gain": 0.12,
        "zoom_velocity": 0.12,
        "displacement": 0.18,
        "stability": -0.15,
        "entropy": 0.25,
        "void_bias": 0.35,
        "attractor_bias": 0.35,
        "power_bias": 0.95,
    },
}

DEFAULT_PARAMS: dict[str, float] = {
    "symmetry_order": 0.35,
    "feedback_strength": 0.4,
    "recursion_gain": 0.35,
    "turbulence": 0.25,
    "trail_length": 0.35,
    "edge_gain": 0.4,
    "zoom_velocity": 0.08,
    "displacement": 0.2,
    "stability": 0.55,
    "entropy": 0.3,
    "palette_energy": 0.5,
    "color_enhancement": 0.5,
    "depth_distortion": 0.35,
    "pattern_complexity": 0.4,
    "bloom": 0.25,
    "chromatic_aberration": 0.1,
    "void_bias": 0.0,
    "attractor_bias": 0.0,
    "power_bias": 0.0,
    "flash_energy": 0.05,
    "peripheral_flow": 0.25,
    "recursive_zoom": 0.15,
}

SUBSTANCE_VISUAL_DEFAULTS: dict[str, dict[str, Any]] = {
    "baseline": {
        "tracers_color": "#63F3E8",
        "tracers_length": 0.1,
        "oscillation_style": "minimal",
        "symmetry_bias": 0.1,
        "depth_distortion": 0.05,
        "color_enhancement": 0.1,
        "pattern_complexity": 0.1,
    },
    "lsd": {
        "tracers_color": "#3EE7F2",
        "tracers_length": 0.85,
        "oscillation_style": "geometric",
        "symmetry_bias": 0.9,
        "depth_distortion": 0.7,
        "color_enhancement": 0.9,
        "pattern_complexity": 0.95,
    },
    "psilocybin": {
        "tracers_color": "#8F7BFF",
        "tracers_length": 0.7,
        "oscillation_style": "organic",
        "symmetry_bias": 0.7,
        "depth_distortion": 0.65,
        "color_enhancement": 0.85,
        "pattern_complexity": 0.8,
    },
    "dmt": {
        "tracers_color": "#FF42C1",
        "tracers_length": 0.95,
        "oscillation_style": "fractal",
        "symmetry_bias": 0.95,
        "depth_distortion": 0.98,
        "color_enhancement": 0.98,
        "pattern_complexity": 1.0,
    },
    "5-meo-dmt": {
        "tracers_color": "#FFFFFF",
        "tracers_length": 0.5,
        "oscillation_style": "minimal",
        "symmetry_bias": 0.3,
        "depth_distortion": 0.95,
        "color_enhancement": 0.4,
        "pattern_complexity": 0.3,
    },
    "mescaline": {
        "tracers_color": "#FFB547",
        "tracers_length": 0.75,
        "oscillation_style": "geometric",
        "symmetry_bias": 0.85,
        "depth_distortion": 0.55,
        "color_enhancement": 0.9,
        "pattern_complexity": 0.85,
    },
    "ketamine": {
        "tracers_color": "#7EC8E3",
        "tracers_length": 0.6,
        "oscillation_style": "smooth",
        "symmetry_bias": 0.5,
        "depth_distortion": 0.85,
        "color_enhancement": 0.5,
        "pattern_complexity": 0.45,
    },
    "pcp": {
        "tracers_color": "#A0FF9A",
        "tracers_length": 0.55,
        "oscillation_style": "unstable",
        "symmetry_bias": 0.35,
        "depth_distortion": 0.7,
        "color_enhancement": 0.55,
        "pattern_complexity": 0.5,
    },
    "mdma": {
        "tracers_color": "#FF6B9D",
        "tracers_length": 0.65,
        "oscillation_style": "organic",
        "symmetry_bias": 0.35,
        "depth_distortion": 0.4,
        "color_enhancement": 0.9,
        "pattern_complexity": 0.4,
    },
    "mda": {
        "tracers_color": "#FF8FB3",
        "tracers_length": 0.7,
        "oscillation_style": "organic",
        "symmetry_bias": 0.4,
        "depth_distortion": 0.45,
        "color_enhancement": 0.95,
        "pattern_complexity": 0.5,
    },
    "2c-b": {
        "tracers_color": "#C3FF4A",
        "tracers_length": 0.75,
        "oscillation_style": "geometric",
        "symmetry_bias": 0.8,
        "depth_distortion": 0.55,
        "color_enhancement": 0.95,
        "pattern_complexity": 0.75,
    },
    "2c-e": {
        "tracers_color": "#9DFF6A",
        "tracers_length": 0.8,
        "oscillation_style": "fractal",
        "symmetry_bias": 0.85,
        "depth_distortion": 0.7,
        "color_enhancement": 0.8,
        "pattern_complexity": 0.9,
    },
    "al-lad": {
        "tracers_color": "#5CE1FF",
        "tracers_length": 0.75,
        "oscillation_style": "geometric",
        "symmetry_bias": 0.75,
        "depth_distortion": 0.6,
        "color_enhancement": 0.85,
        "pattern_complexity": 0.75,
    },
    "mxe": {
        "tracers_color": "#8BB8D8",
        "tracers_length": 0.55,
        "oscillation_style": "smooth",
        "symmetry_bias": 0.4,
        "depth_distortion": 0.8,
        "color_enhancement": 0.4,
        "pattern_complexity": 0.4,
    },
    "eth-lad": {
        "tracers_color": "#E85CFF",
        "tracers_length": 0.9,
        "oscillation_style": "fractal",
        "symmetry_bias": 0.9,
        "depth_distortion": 0.75,
        "color_enhancement": 0.9,
        "pattern_complexity": 0.95,
    },
    "jhana": {
        "tracers_color": "#C9B6FF",
        "tracers_length": 0.35,
        "oscillation_style": "smooth",
        "symmetry_bias": 0.55,
        "depth_distortion": 0.5,
        "color_enhancement": 0.55,
        "pattern_complexity": 0.25,
    },
    "dxm": {
        "tracers_color": "#6BA3C9",
        "tracers_length": 0.5,
        "oscillation_style": "smooth",
        "symmetry_bias": 0.4,
        "depth_distortion": 0.75,
        "color_enhancement": 0.4,
        "pattern_complexity": 0.4,
    },
}

ENGINE_WEIGHT_KEYS = (
    "recursive_feedback",
    "kaleidoscope",
    "flow_field",
    "organic_bloom",
    "void_expansion",
    "entity_lattice",
    "neutral_view",
)


def _clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(v)))


def _stable_hash(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


@dataclass(frozen=True)
class ParameterField:
    """Immutable per-frame/per-tick visualization authority."""

    schema_version: str
    master_seed: int
    mode: str
    substance: str
    experience_id: str | None
    intensity: float
    phase: str
    phase_t: float
    neutral_view: bool
    quality_tier: str
    parameters: dict[str, float]
    engines: dict[str, float]
    palette: dict[str, Any]
    safety: dict[str, Any]
    hash: str
    authority: dict[str, str] = field(
        default_factory=lambda: {
            "parameters": "INFERRED",
            "motifs": "INFERRED",
            "source_existence": "OBSERVED",
        }
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _visual_to_params(visual: dict[str, Any]) -> dict[str, float]:
    return {
        "symmetry_order": float(visual.get("symmetry_bias", 0.35)),
        "trail_length": float(visual.get("tracers_length", 0.35)),
        "depth_distortion": float(visual.get("depth_distortion", 0.35)),
        "color_enhancement": float(visual.get("color_enhancement", 0.5)),
        "pattern_complexity": float(visual.get("pattern_complexity", 0.4)),
        "palette_energy": float(visual.get("color_enhancement", 0.5)),
        "feedback_strength": 0.35 + 0.4 * float(visual.get("pattern_complexity", 0.4)),
        "recursion_gain": 0.25 + 0.5 * float(visual.get("pattern_complexity", 0.4)),
        "edge_gain": 0.3 + 0.4 * float(visual.get("symmetry_bias", 0.35)),
    }


def _phase_intensity(phase_profile: dict[str, Any], t: float) -> tuple[str, float]:
    """Map normalized time t in [0,1] through comeup/peak/plateau/comedown."""
    order = ("comeup", "peak", "plateau", "comedown")
    defaults = {
        "comeup": {"duration_norm": 0.15, "intensity": 0.35},
        "peak": {"duration_norm": 0.45, "intensity": 1.0},
        "plateau": {"duration_norm": 0.25, "intensity": 0.75},
        "comedown": {"duration_norm": 0.15, "intensity": 0.3},
    }
    cursor = 0.0
    t = _clamp(t)
    for name in order:
        cfg = {**defaults[name], **(phase_profile.get(name) or {})}
        dur = max(1e-6, float(cfg.get("duration_norm", defaults[name]["duration_norm"])))
        if t <= cursor + dur or name == "comedown":
            local = (t - cursor) / dur
            base = float(cfg.get("intensity", defaults[name]["intensity"]))
            # Ease within segment
            eased = base * (0.65 + 0.35 * (1.0 - abs(0.5 - local) * 2.0))
            return name, _clamp(eased)
        cursor += dur
    return "plateau", 0.75


def _style_engine_baseline(style: str) -> dict[str, float]:
    weights = {k: 0.0 for k in ENGINE_WEIGHT_KEYS}
    if style == "geometric":
        weights.update(recursive_feedback=0.7, kaleidoscope=0.65, flow_field=0.25, organic_bloom=0.15)
    elif style == "organic":
        weights.update(recursive_feedback=0.45, organic_bloom=0.8, flow_field=0.45, void_expansion=0.2)
    elif style == "fractal":
        weights.update(
            recursive_feedback=0.85,
            entity_lattice=0.8,
            kaleidoscope=0.4,
            flow_field=0.3,
        )
    elif style == "minimal":
        weights.update(void_expansion=0.75, organic_bloom=0.25, recursive_feedback=0.2)
    elif style == "smooth":
        weights.update(flow_field=0.7, void_expansion=0.45, recursive_feedback=0.35)
    elif style == "unstable":
        weights.update(
            flow_field=0.55,
            recursive_feedback=0.4,
            entity_lattice=0.25,
            organic_bloom=0.2,
        )
    else:
        weights.update(recursive_feedback=0.5, flow_field=0.3)
    return weights


def _engine_weights(
    recipe: dict[str, Any] | None,
    mode: str,
    substance: str,
    params: dict[str, float],
    overlay: dict[str, Any] | None = None,
) -> dict[str, float]:
    style = (
        (overlay or {}).get("oscillation_style")
        or (overlay or {}).get("visual_signature", {}).get("oscillation_style")
        or (SUBSTANCE_VISUAL_DEFAULTS.get(substance) or {}).get("oscillation_style", "minimal")
    )
    weights = _style_engine_baseline(style)

    # Distilled substance overlay weights (from scraped+seed recipe aggregates)
    overlay_weights = (overlay or {}).get("engine_weights") or {}
    if overlay_weights:
        for key, value in overlay_weights.items():
            if key in weights:
                weights[key] = 0.45 * weights[key] + 0.55 * float(value)

    if recipe:
        primary = recipe.get("primary_engines") or []
        secondary = recipe.get("secondary_engines") or []
        for i, eng in enumerate(primary):
            key = eng.replace("-", "_")
            if key in weights:
                weights[key] = max(weights[key], 0.85 - 0.1 * i)
        for i, eng in enumerate(secondary):
            key = eng.replace("-", "_")
            if key in weights:
                weights[key] = max(weights[key], 0.45 - 0.05 * i)

    # Mode lean
    if mode == "attractor":
        weights["kaleidoscope"] = max(weights["kaleidoscope"], 0.7)
        weights["entity_lattice"] *= 0.7
    elif mode == "void":
        weights["void_expansion"] = max(weights["void_expansion"], 0.75)
        weights["kaleidoscope"] *= 0.5
    elif mode == "power":
        weights["recursive_feedback"] = max(weights["recursive_feedback"], 0.8)
        weights["entity_lattice"] = max(weights["entity_lattice"], 0.55)

    # Complexity scales lattice/feedback
    weights["entity_lattice"] = _clamp(weights["entity_lattice"] * (0.5 + params.get("pattern_complexity", 0.4)))
    weights["recursive_feedback"] = _clamp(weights["recursive_feedback"])

    total = sum(weights.values()) or 1.0
    return {k: round(v / total, 4) for k, v in weights.items()}


def _resolve_overlay(substance: str, substance_overlay: dict[str, Any] | None) -> dict[str, Any] | None:
    if substance_overlay:
        return substance_overlay
    try:
        from psyfi_core.experiences.catalog import get_default_catalog

        return get_default_catalog().overlay(substance)
    except Exception:  # noqa: BLE001
        return None


def _apply_modulators(params: dict[str, float], modulators: dict[str, float] | None) -> dict[str, float]:
    """Optional modulators — ParameterField only, never direct-to-shader."""
    if not modulators:
        return params
    camera = _clamp(float(modulators.get("camera", 0.0)))
    motion = _clamp(float(modulators.get("motion", 0.0)))
    midi = _clamp(float(modulators.get("midi", 0.0)))
    audio = _clamp(float(modulators.get("audio", 0.0)))
    haptics = _clamp(float(modulators.get("haptics", 0.0)))
    # Keep modulators subtle and safety-friendly.
    params["palette_energy"] = _clamp(params.get("palette_energy", 0.5) + 0.15 * camera + 0.1 * audio)
    params["depth_distortion"] = _clamp(params.get("depth_distortion", 0.35) + 0.12 * camera)
    params["peripheral_flow"] = _clamp(params.get("peripheral_flow", 0.25) + 0.18 * motion + 0.1 * haptics)
    params["displacement"] = _clamp(params.get("displacement", 0.2) + 0.12 * motion + 0.08 * audio)
    params["feedback_strength"] = _clamp(params.get("feedback_strength", 0.4) + 0.2 * midi + 0.1 * audio)
    params["recursion_gain"] = _clamp(params.get("recursion_gain", 0.35) + 0.15 * midi)
    params["turbulence"] = _clamp(params.get("turbulence", 0.25) + 0.1 * haptics)
    params["flash_energy"] = _clamp(
        params.get("flash_energy", 0.05) + 0.04 * max(camera, midi, audio * 0.5)
    )
    return params


def map_parameters(
    *,
    substance: str = "lsd",
    mode: str = "open",
    intensity: float = 0.7,
    seed: int = 42,
    experience: dict[str, Any] | None = None,
    substance_visual: dict[str, Any] | None = None,
    substance_overlay: dict[str, Any] | None = None,
    modulators: dict[str, float] | None = None,
    phase_t: float = 0.4,
    neutral_view: bool = False,
    reduce_motion: bool = False,
    dim_flashing: bool = False,
    quality_tier: str = "balanced",
) -> ParameterField:
    """Build one immutable parameter field snapshot."""
    substance = (substance or "baseline").lower().replace("_", "-")
    if substance == "5meo-dmt":
        substance = "5-meo-dmt"
    mode = (mode or "open").lower()
    if mode not in MODE_BIASES:
        mode = "open"
    intensity = _clamp(intensity)

    overlay = _resolve_overlay(substance, substance_overlay)
    overlay_signature = (overlay or {}).get("visual_signature") or {}

    visual = {
        **SUBSTANCE_VISUAL_DEFAULTS.get("baseline", {}),
        **SUBSTANCE_VISUAL_DEFAULTS.get(substance, {}),
        **overlay_signature,
        **(substance_visual or {}),
    }
    if overlay and overlay.get("tracers_color"):
        visual.setdefault("tracers_color", overlay["tracers_color"])
    if overlay and overlay.get("oscillation_style"):
        visual["oscillation_style"] = overlay["oscillation_style"]

    if experience and experience.get("visual_recipe", {}).get("palette"):
        pal = experience["visual_recipe"]["palette"]
        if pal.get("tracers"):
            visual["tracers_color"] = pal["tracers"]
        if pal.get("energy") is not None:
            visual["color_enhancement"] = float(pal["energy"])
    elif overlay and overlay.get("palette"):
        pal = overlay["palette"]
        if pal.get("tracers"):
            visual["tracers_color"] = pal["tracers"]
        if pal.get("energy") is not None:
            visual["color_enhancement"] = float(pal["energy"])

    params = dict(DEFAULT_PARAMS)
    params.update(_visual_to_params(visual))

    # Substance-level distilled bias, then recipe-specific bias
    for source_bias in (
        (overlay or {}).get("parameter_bias") or {},
        ((experience or {}).get("visual_recipe") or {}).get("parameter_bias") or {},
    ):
        for k, v in source_bias.items():
            if k in params or k in DEFAULT_PARAMS:
                params[k] = float(v)

    recipe = (experience or {}).get("visual_recipe") or {}
    for k, v in MODE_BIASES[mode].items():
        params[k] = params.get(k, 0.0) + float(v)

    phase_profile = recipe.get("phase_profile") or (overlay or {}).get("phase_profile") or {}
    phase_name, phase_amp = _phase_intensity(phase_profile, phase_t)
    scale = intensity * phase_amp
    # Scale expressive params by intensity/phase; keep some floor for readability
    expressive = [
        "feedback_strength",
        "recursion_gain",
        "turbulence",
        "trail_length",
        "edge_gain",
        "zoom_velocity",
        "displacement",
        "entropy",
        "palette_energy",
        "color_enhancement",
        "depth_distortion",
        "pattern_complexity",
        "bloom",
        "chromatic_aberration",
        "peripheral_flow",
        "recursive_zoom",
        "flash_energy",
    ]
    for k in expressive:
        if k in params:
            base = params[k]
            params[k] = _clamp(base * (0.25 + 0.75 * scale))

    params["stability"] = _clamp(params.get("stability", 0.55) * (1.15 - 0.35 * scale) + 0.1)
    params = _apply_modulators(params, modulators)

    safety = {
        "max_flash_hz": float((experience or {}).get("safety", {}).get("max_flash_hz", 2.0)),
        "max_luminance_delta": float(
            (experience or {}).get("safety", {}).get("max_luminance_delta", 0.35)
        ),
        "reduced_motion": reduce_motion,
        "dim_flashing": dim_flashing,
    }

    if reduce_motion:
        params["recursive_zoom"] = _clamp(params.get("recursive_zoom", 0.1) * 0.25)
        params["zoom_velocity"] = _clamp(params.get("zoom_velocity", 0.05) * 0.2)
        params["peripheral_flow"] = _clamp(params.get("peripheral_flow", 0.2) * 0.35)
        params["turbulence"] = _clamp(params.get("turbulence", 0.2) * 0.5)
        params["flash_energy"] = _clamp(params.get("flash_energy", 0.05) * 0.2)
        safety["max_flash_hz"] = min(safety["max_flash_hz"], 1.0)

    if dim_flashing:
        params["flash_energy"] = _clamp(params.get("flash_energy", 0.05) * 0.15)
        params["bloom"] = _clamp(params.get("bloom", 0.25) * 0.6)
        params["color_enhancement"] = _clamp(params.get("color_enhancement", 0.5) * 0.85)
        safety["max_flash_hz"] = min(safety["max_flash_hz"], 1.5)
        safety["max_luminance_delta"] = min(safety["max_luminance_delta"], 0.22)

    if overlay and overlay.get("safety"):
        safety["max_flash_hz"] = min(
            safety["max_flash_hz"],
            float(overlay["safety"].get("max_flash_hz", safety["max_flash_hz"])),
        )
        safety["max_luminance_delta"] = min(
            safety["max_luminance_delta"],
            float(overlay["safety"].get("max_luminance_delta", safety["max_luminance_delta"])),
        )

    engines = _engine_weights(recipe, mode, substance, params, overlay=overlay)

    if neutral_view:
        params = {k: (0.05 if k not in ("stability",) else 0.95) for k in params}
        params["stability"] = 0.98
        params["flash_energy"] = 0.0
        params["recursive_zoom"] = 0.0
        params["peripheral_flow"] = 0.0
        engines = {k: (1.0 if k == "neutral_view" else 0.0) for k in ENGINE_WEIGHT_KEYS}
        phase_name = "neutral"

    # Quality tier soft clamps (shell LOD + GPU battery alias)
    tier_key = (quality_tier or "balanced").lower().replace("-", "_")
    if tier_key in ("battery_saver",):
        tier_key = "battery"
    if tier_key == "efficient":
        params["pattern_complexity"] = _clamp(params.get("pattern_complexity", 0.4) * 0.75)
        params["bloom"] = _clamp(params.get("bloom", 0.25) * 0.7)
    elif tier_key in ("survival", "battery"):
        params["pattern_complexity"] = _clamp(params.get("pattern_complexity", 0.4) * 0.45)
        params["recursion_gain"] = _clamp(params.get("recursion_gain", 0.3) * 0.5)
        params["bloom"] = _clamp(params.get("bloom", 0.25) * 0.55)
        engines = {
            k: (v if k in ("recursive_feedback", "neutral_view", "organic_bloom") else v * 0.25)
            for k, v in engines.items()
        }
        total = sum(engines.values()) or 1.0
        engines = {k: round(v / total, 4) for k, v in engines.items()}

    # Final safety clamps on flash
    max_flash = safety["max_flash_hz"]
    params["flash_energy"] = _clamp(params.get("flash_energy", 0.0), 0.0, max_flash / 3.0)

    rounded_params = {k: round(float(v), 4) for k, v in sorted(params.items())}
    rounded_engines = {k: round(float(v), 4) for k, v in sorted(engines.items())}
    palette = {
        "tracers": visual.get("tracers_color", "#63F3E8"),
        "energy": round(float(rounded_params.get("palette_energy", 0.5)), 4),
        "contrast": round(float(0.45 + 0.4 * rounded_params.get("edge_gain", 0.4)), 4),
    }

    core = {
        "schema_version": SCHEMA_VERSION,
        "master_seed": int(seed),
        "mode": mode,
        "substance": substance,
        "experience_id": (experience or {}).get("id"),
        "intensity": round(intensity, 4),
        "phase": phase_name,
        "phase_t": round(float(phase_t), 4),
        "neutral_view": bool(neutral_view),
        "quality_tier": quality_tier,
        "parameters": rounded_params,
        "engines": rounded_engines,
        "palette": palette,
        "safety": safety,
    }
    digest = _stable_hash(core)
    return ParameterField(hash=digest, **core)


def build_parameter_timeline(
    *,
    steps: int = 24,
    substance: str = "lsd",
    mode: str = "open",
    intensity: float = 0.7,
    seed: int = 42,
    experience: dict[str, Any] | None = None,
    modulators: dict[str, float] | None = None,
    reduce_motion: bool = False,
    dim_flashing: bool = False,
    quality_tier: str = "balanced",
    neutral_view: bool = False,
) -> dict[str, Any]:
    """Build a deterministic timeline of parameter snapshots."""
    steps = max(2, min(int(steps), 256))
    frames: list[dict[str, Any]] = []
    for i in range(steps):
        t = i / (steps - 1)
        snap = map_parameters(
            substance=substance,
            mode=mode,
            intensity=intensity,
            seed=seed,
            experience=experience,
            modulators=modulators,
            phase_t=t,
            neutral_view=neutral_view,
            reduce_motion=reduce_motion,
            dim_flashing=dim_flashing,
            quality_tier=quality_tier,
        )
        frames.append(snap.to_dict())

    timeline_hash = _stable_hash({"seed": seed, "frames": [f["hash"] for f in frames]})
    return {
        "schema_version": SCHEMA_VERSION,
        "seed": seed,
        "steps": steps,
        "substance": substance,
        "mode": mode,
        "intensity": intensity,
        "experience_id": (experience or {}).get("id"),
        "timeline_hash": timeline_hash,
        "frames": frames,
    }


def list_modes() -> Iterable[str]:
    return tuple(MODE_BIASES.keys())
