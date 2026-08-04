"""First-class Journey object helpers (I5) — portable schema, client-archivable.

Server helpers normalize / validate journey packets. Persistence is IndexedDB
in the browser (no server-side journey storage).
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from psyfi_core.visualization.planner import build_planner
from psyfi_core.visualization.spatiotemporal import normalize_anchors

JOURNEY_SCHEMA = "psyfi.journey.v1"


def _stable_hash(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def build_journey(
    *,
    substance: str,
    mode: str,
    intensity: float,
    seed: int,
    experience_id: str | None = None,
    timeline: dict[str, Any] | None = None,
    parameter_field: dict[str, Any] | None = None,
    spatiotemporal_anchors: dict[str, Any] | None = None,
    planner: dict[str, Any] | None = None,
    comparison_id: str | None = None,
    notes: str | None = None,
    experience: dict[str, Any] | None = None,
    title: str | None = None,
) -> dict[str, Any]:
    """Assemble psyfi.journey.v1 for export / IndexedDB archive."""
    frames = list((timeline or {}).get("frames") or [])
    phase_names: list[str] = []
    for fr in frames:
        p = fr.get("phase")
        if p and p not in phase_names:
            phase_names.append(str(p))
    anchors = normalize_anchors(spatiotemporal_anchors)
    plan = planner
    if plan is None:
        plan = build_planner(
            parameter_field=parameter_field or (frames[0] if frames else None),
            spatiotemporal_anchors=anchors,
            notes=notes,
            experience=experience,
            timeline=timeline,
        )
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    body = {
        "schema": JOURNEY_SCHEMA,
        "claim": "INFERRED",
        "title": title
        or (experience or {}).get("title")
        or experience_id
        or f"{substance}-{mode}",
        "substance": substance,
        "mode": mode,
        "intensity": round(float(intensity), 4),
        "seed": int(seed) & 0xFFFFFFFF,
        "experience_id": experience_id or (experience or {}).get("id"),
        "timeline_hash": (timeline or {}).get("timeline_hash"),
        "phase_names": phase_names,
        "frame_count": len(frames),
        "parameter_field_hash": (parameter_field or (frames[0] if frames else {}) or {}).get("hash"),
        "spatiotemporal_anchors": anchors or plan.get("spatiotemporal_anchors"),
        "planner": {
            "hash": plan.get("hash"),
            "planner_text": plan.get("planner_text"),
            "motifs": plan.get("motifs"),
            "lighting_notes": plan.get("lighting_notes"),
            "claim": plan.get("claim"),
        },
        "comparison_id": comparison_id,
        "notes": (str(notes).strip()[:500] if notes and str(notes).strip() else None),
        "updated_at": now,
    }
    body["id"] = "jny-" + _stable_hash(
        {
            "substance": body["substance"],
            "mode": body["mode"],
            "intensity": body["intensity"],
            "seed": body["seed"],
            "experience_id": body["experience_id"],
            "timeline_hash": body["timeline_hash"],
            "planner_hash": (body["planner"] or {}).get("hash"),
            "anchors": body["spatiotemporal_anchors"],
        }
    )
    body["note"] = (
        "Portable Journey object for research/visualization replay. "
        "Client-archivable; not a therapeutic protocol. Not medical advice."
    )
    return body
