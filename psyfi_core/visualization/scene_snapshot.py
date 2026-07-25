"""Immutable GPU scene snapshots derived from ParameterField + optional simulation viz.

Renderer clients must treat these documents as read-only. No symbolic inference runs here —
only deterministic packaging of existing authority channels for the GPU platform.
"""

from __future__ import annotations

import hashlib
import math
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

SCENE_SNAPSHOT_SCHEMA = "psyfi.scene_snapshot.v1"

# Served from packages/psyfi-gpu-renderer/public/assets/fixtures via /gpu/ StaticFiles.
_FIXTURE_KTX2_GROUND = {
    "id": "fixture_ground",
    "url": "/gpu/assets/fixtures/ground_rgba8.ktx2",
    "role": "ground",
}

_QUALITY_POST = {
    "ultra": {
        "taa": True,
        "ssao": True,
        "ssr": True,
        "bloom": True,
        "volumetric_fog": True,
        "contact_shadows": True,
        "motion_blur": True,
        "depth_of_field": True,
        "chromatic_aberration": True,
        "color_grading": True,
        "hdr": True,
    },
    "high": {
        "taa": True,
        "ssao": True,
        "ssr": True,
        "bloom": True,
        "volumetric_fog": True,
        "contact_shadows": True,
        "motion_blur": False,
        "depth_of_field": True,
        "chromatic_aberration": True,
        "color_grading": True,
        "hdr": True,
    },
    "balanced": {
        "taa": True,
        "ssao": True,
        "ssr": False,
        "bloom": True,
        "volumetric_fog": False,
        "contact_shadows": True,
        "motion_blur": False,
        "depth_of_field": True,
        "chromatic_aberration": False,
        "color_grading": True,
        "hdr": True,
    },
    "battery": {
        "taa": False,
        "ssao": False,
        "ssr": False,
        "bloom": True,
        "volumetric_fog": False,
        "contact_shadows": False,
        "motion_blur": False,
        "depth_of_field": False,
        "chromatic_aberration": False,
        "color_grading": True,
        "hdr": False,
    },
}


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, float(x)))


def _stable_unit(seed_hash: str, salt: str) -> float:
    digest = hashlib.sha256(f"{seed_hash}:{salt}".encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def _procedural_from_field(parameter_field: dict[str, Any]) -> dict[str, Any]:
    """Deterministic procedural descriptors — geometry, not textures."""
    seed = int(parameter_field.get("master_seed") or 42)
    phash = str(parameter_field.get("hash") or seed)
    params = parameter_field.get("parameters") or {}
    engines = parameter_field.get("engines") or {}
    intensity = _clamp01(parameter_field.get("intensity") or 0.5)
    complexity = _clamp01(params.get("pattern_complexity") or 0.4)
    void_b = _clamp01(params.get("void_bias") or 0.0)
    attr_b = _clamp01(params.get("attractor_bias") or 0.0)

    glyph_count = 3 + int(complexity * 9)
    crystal_count = 2 + int((engines.get("entity_lattice") or 0.1) * 10)
    ribbon_count = 1 + int((engines.get("flow_field") or 0.2) * 6)
    metaball_count = 2 + int((engines.get("organic_bloom") or 0.2) * 8)

    glyphs = []
    for i in range(glyph_count):
        glyphs.append(
            {
                "id": f"glyph_{i}",
                "kind": "vector_glyph",
                "seed": seed + i * 17,
                "scale": 0.15 + 0.35 * _stable_unit(phash, f"g_scale_{i}"),
                "orbit": [
                    math.cos(i * 1.7) * (0.4 + intensity * 0.4),
                    (_stable_unit(phash, f"g_y_{i}") - 0.5) * 0.6,
                    math.sin(i * 1.7) * (0.4 + intensity * 0.4),
                ],
                "weight": _clamp01((engines.get("kaleidoscope") or 0.2) + complexity * 0.3),
            }
        )

    ribbons = []
    for i in range(ribbon_count):
        ribbons.append(
            {
                "id": f"ribbon_{i}",
                "kind": "spline_ribbon",
                "seed": seed + 100 + i,
                "thickness": 0.02 + 0.06 * _stable_unit(phash, f"r_w_{i}"),
                "turbulence": _clamp01(params.get("turbulence") or 0.25),
                "flow": _clamp01(engines.get("flow_field") or 0.2),
            }
        )

    metaballs = []
    for i in range(metaball_count):
        metaballs.append(
            {
                "id": f"meta_{i}",
                "kind": "metaball",
                "center": [
                    (_stable_unit(phash, f"m_x_{i}") - 0.5) * 1.4,
                    (_stable_unit(phash, f"m_y_{i}") - 0.5) * 1.0,
                    (_stable_unit(phash, f"m_z_{i}") - 0.5) * 1.4,
                ],
                "radius": 0.12 + 0.25 * _stable_unit(phash, f"m_r_{i}") * (0.5 + intensity),
                "hardness": 0.35 + 0.5 * (1.0 - void_b),
            }
        )

    crystals = []
    for i in range(crystal_count):
        crystals.append(
            {
                "id": f"crystal_{i}",
                "kind": "procedural_crystal",
                "seed": seed + 500 + i,
                "lod_levels": 3,
                "instance_budget": 64 + int(attr_b * 192),
                "sharpness": _clamp01(0.3 + (engines.get("entity_lattice") or 0.1)),
            }
        )

    sdf_nodes = [
        {
            "id": "sdf_field",
            "kind": "sdf_union",
            "blend": 0.15 + void_b * 0.35,
            "children": [g["id"] for g in glyphs[:4]] + [m["id"] for m in metaballs[:3]],
        }
    ]

    volumes = [
        {
            "id": "symbol_volume",
            "kind": "volumetric_symbol",
            "density": _clamp01(0.05 + (engines.get("void_expansion") or 0.15) * 0.4),
            "scatter": _clamp01(params.get("bloom") or 0.25),
            "enabled_tiers": ["ultra", "high"],
        }
    ]

    return {
        "glyphs": glyphs,
        "sdf_nodes": sdf_nodes,
        "ribbons": ribbons,
        "metaballs": metaballs,
        "volumetric_symbols": volumes,
        "crystals": crystals,
    }


def normalize_snapshot_quality_tier(quality_tier: str | None) -> str:
    """Map client/shell aliases onto the scene-snapshot post stack keys."""
    tier = (quality_tier or "balanced").lower().replace("-", "_")
    aliases = {
        "battery_saver": "battery",
        # Shell Live Experience LOD vocabulary → GPU post tiers
        "survival": "battery",
        "efficient": "balanced",
    }
    tier = aliases.get(tier, tier)
    if tier not in _QUALITY_POST:
        tier = "balanced"
    return tier


def resolve_include_fixture_assets(flag: bool | None = None) -> bool:
    """Opt-in fixture asset refs. Env PSYFI_SCENE_ASSETS=fixtures|1 wins when set."""
    import os

    env = (os.environ.get("PSYFI_SCENE_ASSETS") or "").strip().lower()
    if env in {"1", "true", "yes", "fixtures", "fixture"}:
        return True
    if env in {"0", "false", "no", "off", "none"}:
        return False
    return bool(flag)


def fixture_scene_assets() -> dict[str, list[dict[str, str]]]:
    """Tiny KTX2 ground tint for SceneAssetLayer E2E — not product art packs."""
    return {
        "gltf": [],
        "ktx2": [dict(_FIXTURE_KTX2_GROUND)],
        "splats": [],
    }


def empty_scene_assets() -> dict[str, list[dict[str, str]]]:
    return {"gltf": [], "ktx2": [], "splats": []}


def build_scene_snapshot(
    *,
    parameter_field: dict[str, Any],
    simulation: dict[str, Any] | None = None,
    quality_tier: str = "balanced",
    sequence: int = 1,
    camera: dict[str, Any] | None = None,
    snapshot_id: str | None = None,
    include_fixture_assets: bool = False,
) -> dict[str, Any]:
    """Build an immutable scene snapshot for the GPU renderer."""
    tier = normalize_snapshot_quality_tier(quality_tier)

    field = dict(parameter_field)
    # Prefer snapshot quality when client asks; keep field copy intact otherwise.
    field.setdefault("quality_tier", tier)

    post = dict(_QUALITY_POST[tier])
    safety = dict(field.get("safety") or {})
    # Neutral / reduce-motion: collapse expensive post.
    if field.get("neutral_view"):
        post = {k: False for k in post}
        post["color_grading"] = True
        post["hdr"] = tier in {"ultra", "high", "balanced"}

    viz = None
    if simulation and isinstance(simulation.get("visualization"), dict):
        viz = simulation["visualization"]

    published = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    sid = snapshot_id or str(uuid4())

    cam = camera or {
        "position": [0.0, 0.35, 2.4],
        "target": [0.0, 0.0, 0.0],
        "fov_deg": 45.0,
        "exposure": 1.0,
        "near": 0.05,
        "far": 80.0,
    }

    lighting = {
        "ambient_intensity": 0.15 + 0.25 * _clamp01((field.get("palette") or {}).get("energy") or 0.5),
        "key_intensity": 1.2,
        "ibl_intensity": 0.8 if post.get("hdr") else 0.4,
        "exposure_mode": "physically_based",
    }

    return {
        "schema_version": SCENE_SNAPSHOT_SCHEMA,
        "snapshot_id": sid,
        "sequence": int(sequence),
        "published_at": published,
        "quality_tier": tier,
        "parameter_field": field,
        "simulation": simulation,
        "magnitude_field": (viz or {}).get("field") if viz else None,
        "procedural": _procedural_from_field(field),
        "camera": cam,
        "lighting": lighting,
        "post": post,
        "safety": safety,
        "assets": (
            fixture_scene_assets()
            if resolve_include_fixture_assets(include_fixture_assets)
            else empty_scene_assets()
        ),
        "authority": {
            "parameters": "INFERRED",
            "motifs": "INFERRED",
            "source_existence": "OBSERVED",
            "simulation_metrics": "OBSERVED" if simulation else None,
        },
        "provenance_id": (simulation or {}).get("provenance_id"),
        "note": (
            "Immutable scene description for GPU rendering. "
            "Analysis publishes; renderer interpolates and discards stale sequences. "
            "Modeled phenomenology for research/visualization only — not medical advice."
        ),
    }
