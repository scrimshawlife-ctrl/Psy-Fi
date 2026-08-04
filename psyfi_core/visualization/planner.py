"""Deterministic phenomenological planner (I4).

Builds an INFERRED planner packet from ParameterField + optional spatiotemporal
anchors. Never authoritative over ParameterField or simulation truth.
No external model calls.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from psyfi_core.visualization.spatiotemporal import (
    format_anchor_prompt_clause,
    normalize_anchors,
)

PLANNER_SCHEMA = "psyfi.planner.v1"

_ENGINE_MOTIFS: dict[str, str] = {
    "recursive_feedback": "recursive feedback folds",
    "kaleidoscope": "kaleidoscopic symmetry",
    "flow_field": "flow-field drift",
    "organic_bloom": "organic bloom soft-edges",
    "void_expansion": "void expansion depth",
    "entity_lattice": "entity lattice structure",
    "neutral_view": "neutral calm field",
}

_MODE_MOTIFS: dict[str, list[str]] = {
    "open": ["open-field expanse", "gentle turbulence"],
    "attractor": ["attractor lock", "edge-gain geometry"],
    "void": ["void crush", "depth pull"],
    "power": ["power-mode intensity", "high feedback recursion"],
}


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, float(v)))


def _stable_hash(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def _field_dict(parameter_field: dict[str, Any] | Any | None) -> dict[str, Any]:
    if parameter_field is None:
        return {}
    if hasattr(parameter_field, "to_dict"):
        return dict(parameter_field.to_dict())
    if isinstance(parameter_field, dict):
        return parameter_field
    return {}


def extract_motifs(field: dict[str, Any], *, limit: int = 6) -> list[str]:
    """Ranked motif labels from engines + mode (deterministic)."""
    motifs: list[tuple[float, str]] = []
    engines = field.get("engines") or {}
    if isinstance(engines, dict):
        for key, label in _ENGINE_MOTIFS.items():
            w = float(engines.get(key) or 0.0)
            if w >= 0.18:
                motifs.append((w, label))
    mode = str(field.get("mode") or "open")
    for i, label in enumerate(_MODE_MOTIFS.get(mode, _MODE_MOTIFS["open"])):
        motifs.append((0.55 - i * 0.05, label))
    params = field.get("parameters") or {}
    if isinstance(params, dict):
        if float(params.get("pattern_complexity") or 0) >= 0.55:
            motifs.append((float(params["pattern_complexity"]), "dense pattern complexity"))
        if float(params.get("bloom") or 0) >= 0.45:
            motifs.append((float(params["bloom"]), "luminous bloom"))
        if float(params.get("trail_length") or 0) >= 0.5:
            motifs.append((float(params["trail_length"]), "extended tracer trails"))
    motifs.sort(key=lambda pair: (-pair[0], pair[1]))
    out: list[str] = []
    seen: set[str] = set()
    for _, label in motifs:
        if label in seen:
            continue
        seen.add(label)
        out.append(label)
        if len(out) >= limit:
            break
    return out


def lighting_notes(field: dict[str, Any], anchors: dict[str, Any] | None) -> str:
    """Short lighting guidance from palette + optional solar elevation."""
    palette = field.get("palette") or {}
    energy = float(palette.get("energy") or (field.get("parameters") or {}).get("palette_energy") or 0.5)
    parts: list[str] = []
    if energy >= 0.65:
        parts.append("high-energy palette with vivid tracers")
    elif energy <= 0.35:
        parts.append("low-energy palette with restrained chroma")
    else:
        parts.append("balanced palette energy")
    elev = None if not anchors else anchors.get("solar_elevation_deg")
    if elev is not None:
        e = float(elev)
        if e >= 40:
            parts.append(f"daylight plate (solar {e:.1f}°)")
        elif e >= 0:
            parts.append(f"low-sun / twilight plate (solar {e:.1f}°)")
        else:
            parts.append(f"night plate (solar {e:.1f}°)")
    intensity = float(field.get("intensity") or 0.7)
    parts.append(f"field intensity {intensity:.2f}")
    if field.get("neutral_view"):
        parts.append("Neutral View active — calm luminance floor")
    return "; ".join(parts) + "."


def planner_text(
    *,
    field: dict[str, Any],
    motifs: list[str],
    lighting: str,
    anchors: dict[str, Any] | None,
    notes: str | None,
    experience_title: str | None,
) -> str:
    substance = str(field.get("substance") or "unknown")
    mode = str(field.get("mode") or "open")
    title = experience_title or "open field"
    motif_txt = ", ".join(motifs[:5]) if motifs else "procedural field motifs"
    anchor_clause = format_anchor_prompt_clause(anchors)
    note_bit = ""
    if notes and str(notes).strip():
        note_bit = f" Operator notes: {str(notes).strip()[:240]}."
    anchor_bit = f" {anchor_clause}" if anchor_clause else ""
    return (
        f"INFERRED planner for modeled phenomenology visualization — "
        f"substance {substance}, mode {mode}, recipe “{title}”. "
        f"Motifs: {motif_txt}. Lighting: {lighting}"
        f"{anchor_bit}{note_bit} "
        f"Not medical advice; ParameterField remains visual authority."
    )


def build_planner(
    *,
    parameter_field: dict[str, Any] | Any | None = None,
    spatiotemporal_anchors: dict[str, Any] | None = None,
    notes: str | None = None,
    experience: dict[str, Any] | None = None,
    timeline: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Assemble psyfi.planner.v1 from a ParameterField (or first timeline frame)."""
    field = _field_dict(parameter_field)
    if not field and timeline:
        frames = list((timeline or {}).get("frames") or [])
        if frames:
            field = dict(frames[0])
            # Prefer timeline-level substance/mode/intensity when present.
            for key in ("substance", "mode", "intensity", "master_seed"):
                if key in (timeline or {}) and key not in field:
                    field[key] = timeline[key]
            if "master_seed" not in field and (timeline or {}).get("seed") is not None:
                field["master_seed"] = timeline["seed"]

    anchors = normalize_anchors(spatiotemporal_anchors)
    if anchors is None and experience:
        anchors = normalize_anchors(experience.get("spatiotemporal_anchors"))

    title = None
    if experience:
        title = experience.get("title") or experience.get("name")
    motifs = extract_motifs(field)
    lighting = lighting_notes(field, anchors)
    text = planner_text(
        field=field,
        motifs=motifs,
        lighting=lighting,
        anchors=anchors,
        notes=notes,
        experience_title=title,
    )
    body = {
        "schema": PLANNER_SCHEMA,
        "claim": "INFERRED",
        "planner_text": text,
        "motifs": motifs,
        "lighting_notes": lighting,
        "parameter_field_hash": field.get("hash"),
        "substance": field.get("substance"),
        "mode": field.get("mode"),
        "intensity": round(float(field.get("intensity") or 0.7), 4),
        "master_seed": field.get("master_seed"),
        "experience_id": (experience or {}).get("id") or field.get("experience_id"),
        "spatiotemporal_anchors": anchors,
        "notes": (str(notes).strip()[:500] if notes and str(notes).strip() else None),
    }
    body["hash"] = _stable_hash(
        {
            "planner_text": body["planner_text"],
            "motifs": body["motifs"],
            "lighting_notes": body["lighting_notes"],
            "parameter_field_hash": body["parameter_field_hash"],
            "anchors": anchors,
            "notes": body["notes"],
        }
    )
    body["note"] = (
        "Deterministic planner artifact (INFERRED). "
        "Not authoritative over ParameterField. Not medical advice."
    )
    return body
