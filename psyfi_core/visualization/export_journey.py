"""Export-journey package: stills + formula prompt for optional external T2V.

Does not call any LLM/video provider. Builds a portable JSON package the client
can download; `t2v_prompt` is a ready-made sidecar string.
"""

from __future__ import annotations

from typing import Any

EXPORT_JOURNEY_SCHEMA = "psyfi.export_journey.v1"


def build_t2v_prompt(
    *,
    substance: str,
    mode: str,
    intensity: float,
    experience_id: str | None,
    experience_title: str | None,
    features: dict[str, Any] | None,
    phase_names: list[str],
) -> str:
    """Short cinematic prompt — research/visualization framing, no medical claims."""
    title = experience_title or experience_id or "open field"
    feat = features or {}
    warmth = feat.get("warmth")
    energy = feat.get("energy")
    edges = feat.get("edge_density")
    phases = " → ".join(phase_names[:6]) if phase_names else "comeup → peak → settle"
    cues = []
    if energy is not None:
        cues.append(f"energy {float(energy):.2f}")
    if warmth is not None:
        cues.append(f"warmth {float(warmth):.2f}")
    if edges is not None:
        cues.append(f"edge density {float(edges):.2f}")
    cue_txt = ", ".join(cues) if cues else "procedural field cues"
    return (
        f"Abstract consciousness-field visualization journey, substance signature {substance}, "
        f"mode {mode}, intensity {float(intensity):.2f}, recipe “{title}”. "
        f"Phase arc: {phases}. Visual cues: {cue_txt}. "
        f"Smooth cinematic camera drift through luminous procedural geometry, "
        f"calm color grading, no text overlays, research visualization aesthetic — "
        f"not a depiction of any real clinical or medical state."
    )


def build_export_journey(
    *,
    timeline: dict[str, Any] | None,
    stills: list[dict[str, Any]] | None = None,
    image_seed: dict[str, Any] | None = None,
    experience: dict[str, Any] | None = None,
    t2v_provider: str = "external",
) -> dict[str, Any]:
    """Assemble psyfi.export_journey.v1 from a loaded timeline + optional stills."""
    frames = list((timeline or {}).get("frames") or [])
    substance = str((timeline or {}).get("substance") or (frames[0] or {}).get("substance") or "lsd")
    mode = str((timeline or {}).get("mode") or (frames[0] or {}).get("mode") or "open")
    intensity = float((timeline or {}).get("intensity") or (frames[0] or {}).get("intensity") or 0.7)
    experience_id = (timeline or {}).get("experience_id") or (experience or {}).get("id")
    title = None
    if experience:
        title = experience.get("title") or experience.get("name")
    phase_names: list[str] = []
    for fr in frames:
        p = fr.get("phase")
        if p and p not in phase_names:
            phase_names.append(str(p))
    features = (image_seed or {}).get("features") if image_seed else None
    prompt = build_t2v_prompt(
        substance=substance,
        mode=mode,
        intensity=intensity,
        experience_id=experience_id,
        experience_title=title,
        features=features if isinstance(features, dict) else None,
        phase_names=phase_names,
    )
    clean_stills: list[dict[str, Any]] = []
    for i, s in enumerate(stills or []):
        if not isinstance(s, dict):
            continue
        b64 = s.get("png_base64") or s.get("data")
        if not b64:
            continue
        clean_stills.append(
            {
                "id": str(s.get("id") or f"still_{i}"),
                "phase": s.get("phase"),
                "phase_t": s.get("phase_t"),
                "png_base64": b64,
            }
        )
    return {
        "schema": EXPORT_JOURNEY_SCHEMA,
        "substance": substance,
        "mode": mode,
        "intensity": round(intensity, 4),
        "experience_id": experience_id,
        "master_seed": (timeline or {}).get("seed")
        or (frames[0] or {}).get("master_seed")
        or (image_seed or {}).get("master_seed"),
        "timeline_hash": (timeline or {}).get("timeline_hash"),
        "phase_names": phase_names,
        "stills": clean_stills,
        "image_seed": (
            {
                "master_seed": (image_seed or {}).get("master_seed"),
                "influence": (image_seed or {}).get("influence"),
                "features": (image_seed or {}).get("features"),
                "parameter_hints": (image_seed or {}).get("parameter_hints"),
            }
            if image_seed
            else None
        ),
        "t2v": {
            "provider": t2v_provider,
            "status": "prompt_only",
            "prompt": prompt,
            "note": (
                "Sidecar prompt for an external text-to-video tool. "
                "PsyFi does not invoke a provider; paste prompt + stills externally."
            ),
        },
        "note": (
            "Export journey package for research/visualization sharing. "
            "Not medical advice. Prefer safety-presented stills over raw uploads."
        ),
    }
