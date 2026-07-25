#!/usr/bin/env python3
"""Build derived experience catalog from curated phenomenology JSON + seed recipes."""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POS_DIR = ROOT / "data" / "phenomenology" / "positive"
OUT_DIR = ROOT / "data" / "phenomenology" / "derived"
OUT_PATH = OUT_DIR / "experience_catalog.v1.json"
OVERLAY_PATH = OUT_DIR / "substance_visual_overlays.v1.json"

MOTIF_PATTERNS = {
    "geometry": re.compile(
        r"mandala|geometric|fractal|spiral|lattice|kaleidoscope|symmetry|tessellat|grid|hexagon|pattern|fleur",
        re.I,
    ),
    "entities": re.compile(
        r"\bentity\b|\bentities\b|\bbeings?\b|\bfaces?\b|\bgod\b|presence|machine world|lattice presence",
        re.I,
    ),
    "color_light": re.compile(
        r"color|colour|neon|iridescent|rainbow|glow|lumin|chromatic|aurora|spectrum|magenta|cyan|opal|aura|vibrant",
        re.I,
    ),
    "space_void": re.compile(
        r"void|space|tunnel|wormhole|portal|infinite|abyss|cosmos|universe|dimension|starfield|breakthrough",
        re.I,
    ),
    "body_somatic": re.compile(
        r"body|skin|breath|heartbeat|somatic|dissolve|melt|vibrate|pulse|ego",
        re.I,
    ),
    "time_memory": re.compile(r"time|memory|loop|eternity|past|future|timeless|phase", re.I),
    "nature": re.compile(
        r"forest|tree|water|ocean|cloud|flower|floral|bird|plant|mountain|earth|organic|veil",
        re.I,
    ),
    "machines": re.compile(
        r"machine|circuit|code|digital|pixel|matrix|hyperdimensional|architecture",
        re.I,
    ),
}

POS_WORDS = re.compile(
    r"beautiful|amazing|profound|bliss|cosmic|love|healing|wonder|awe|euphor|peace|ecstasy|exhilarat|positive|life.?chang",
    re.I,
)
NEG_WORDS = re.compile(r"horror|terror|nightmare|panic|bad trip|trauma dump|dull|terrifying", re.I)


def _hash(s: str) -> str:
    return "sha256:" + hashlib.sha256(s.encode("utf-8", errors="ignore")).hexdigest()[:16]


def _text_of(d: dict) -> str:
    parts = [
        d.get("title") or "",
        d.get("description") or "",
        d.get("content") or "",
        (d.get("markdown") or "")[:6000],
        d.get("text") or "",
    ]
    text = " ".join(parts)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\|", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _motif_scores(text: str) -> dict[str, float]:
    scores = {}
    for k, pat in MOTIF_PATTERNS.items():
        hits = pat.findall(text)
        scores[k] = round(min(1.0, len(hits) / 8.0), 3)
    return scores


def _valence(text: str) -> str:
    pos = len(POS_WORDS.findall(text))
    neg = len(NEG_WORDS.findall(text))
    if pos >= neg and pos > 0:
        return "positive"
    if neg > pos:
        return "mixed"
    return "neutral"


def _hooks(text: str, n: int = 3) -> list[str]:
    # short clauses containing motif keywords
    hooks = []
    for sent in re.split(r"(?<=[.!?])\s+", text):
        s = sent.strip()
        if 40 <= len(s) <= 180 and any(p.search(s) for p in MOTIF_PATTERNS.values()):
            # de-identify light scrub of urls
            s = re.sub(r"https?://\S+", "", s).strip()
            if s and s not in hooks:
                hooks.append(s[:160])
        if len(hooks) >= n:
            break
    return hooks


def _engines_for(motifs: dict[str, float], substance: str) -> tuple[list[str], list[str], str]:
    ranked = sorted(motifs.items(), key=lambda kv: kv[1], reverse=True)
    primary, secondary = [], []
    mode = "open"
    top = {k for k, v in ranked[:3] if v >= 0.15}

    if substance in ("dmt", "5-meo-dmt") or "machines" in top or (
        motifs.get("geometry", 0) > 0.5 and motifs.get("space_void", 0) > 0.4
    ):
        primary = ["recursive_feedback", "entity_lattice"]
        secondary = ["kaleidoscope"]
        mode = "power" if substance == "dmt" else "void"
    elif "geometry" in top and motifs.get("geometry", 0) >= motifs.get("nature", 0):
        primary = ["kaleidoscope", "recursive_feedback"]
        secondary = ["organic_bloom"]
        mode = "attractor"
    elif "nature" in top or substance == "psilocybin":
        primary = ["organic_bloom", "recursive_feedback"]
        secondary = ["flow_field", "void_expansion"]
        mode = "open"
    elif "space_void" in top or substance in ("ketamine", "5-meo-dmt"):
        primary = ["void_expansion", "flow_field"]
        secondary = ["organic_bloom"]
        mode = "void"
    else:
        primary = ["recursive_feedback", "flow_field"]
        secondary = ["organic_bloom"]
        mode = "open"

    if substance == "5-meo-dmt":
        primary, secondary, mode = ["void_expansion"], ["organic_bloom"], "void"
    if substance == "mescaline":
        primary, secondary, mode = ["kaleidoscope", "recursive_feedback"], ["organic_bloom"], "attractor"
    if substance == "ketamine":
        primary, secondary, mode = ["flow_field", "void_expansion"], ["recursive_feedback"], "void"

    return primary, secondary, mode


def _param_bias(motifs: dict[str, float], substance: str) -> dict[str, float]:
    g = motifs.get("geometry", 0)
    c = motifs.get("color_light", 0)
    v = motifs.get("space_void", 0)
    m = motifs.get("machines", 0)
    n = motifs.get("nature", 0)
    return {
        "symmetry_order": round(0.35 + 0.55 * g, 3),
        "feedback_strength": round(0.4 + 0.45 * max(g, m), 3),
        "recursion_gain": round(0.3 + 0.55 * max(m, g, v), 3),
        "turbulence": round(0.2 + 0.4 * max(m, motifs.get("body_somatic", 0) * 0.5), 3),
        "trail_length": round(0.3 + 0.5 * c, 3),
        "edge_gain": round(0.35 + 0.45 * g, 3),
        "zoom_velocity": round(0.05 + 0.35 * v, 3),
        "displacement": round(0.15 + 0.35 * n + 0.2 * m, 3),
        "stability": round(0.7 - 0.35 * m - 0.15 * v, 3),
        "entropy": round(0.25 + 0.5 * max(m, v), 3),
        "palette_energy": round(0.4 + 0.55 * c, 3),
        "pattern_complexity": round(0.35 + 0.6 * max(g, m), 3),
        "depth_distortion": round(0.3 + 0.55 * v, 3),
        "bloom": round(0.2 + 0.4 * c, 3),
    }


TRACERS = {
    "lsd": "#3EE7F2",
    "psilocybin": "#8F7BFF",
    "dmt": "#FF42C1",
    "5-meo-dmt": "#FFFFFF",
    "mescaline": "#FFB547",
    "ketamine": "#7EC8E3",
    "pcp": "#A0FF9A",
    "baseline": "#63F3E8",
}


def seed_recipes() -> list[dict]:
    """Hand-authored positive recipes grounded in observed motif clusters."""
    base = [
        ("lsd", "floral_geometry", "Floral Geometric Lattice", "attractor",
         ["kaleidoscope", "recursive_feedback"], ["organic_bloom"],
         {"geometry": 0.9, "color_light": 0.75, "nature": 0.55},
         ["floral geometric designs glimmer as light dances on patterned texture"]),
        ("lsd", "color_salience", "Color Salience Aura Field", "open",
         ["recursive_feedback"], ["organic_bloom", "flow_field"],
         {"color_light": 0.95, "geometry": 0.4, "body_somatic": 0.35},
         ["colors become emotionally salient; glow and aura intensify without panic"]),
        ("lsd", "cosmic_geometry", "Physics-Edge Cosmic Geometry", "power",
         ["recursive_feedback", "entity_lattice"], ["kaleidoscope"],
         {"geometry": 0.85, "space_void": 0.7, "time_memory": 0.5},
         ["structured cosmic geometry at the edge of scale and recursion"]),
        ("lsd", "soft_room", "Soft Room Glow", "open",
         ["organic_bloom", "recursive_feedback"], ["flow_field"],
         {"color_light": 0.7, "nature": 0.35, "body_somatic": 0.4},
         ["room softens; gentle pattern crawl and warm chromatic lift"]),
        ("psilocybin", "veil_fractals", "Veil Fractals CEV", "open",
         ["organic_bloom", "recursive_feedback"], ["void_expansion"],
         {"geometry": 0.7, "nature": 0.6, "space_void": 0.45},
         ["closed-eye dancing fractals behind a soft veil toward oneness"]),
        ("psilocybin", "breath_bloom", "Organic Breath Bloom", "open",
         ["organic_bloom", "flow_field"], ["recursive_feedback"],
         {"nature": 0.85, "body_somatic": 0.55, "color_light": 0.6},
         ["organic bloom pulses with breath; edges soften into living texture"]),
        ("psilocybin", "synesthetic_drift", "Synesthetic Palette Drift", "attractor",
         ["organic_bloom"], ["flow_field", "kaleidoscope"],
         {"color_light": 0.9, "time_memory": 0.4, "nature": 0.4},
         ["color-emotion coupling drifts the palette with slow certainty"]),
        ("dmt", "tunnel_entry", "Chrysanthemum Tunnel Entry", "power",
         ["recursive_feedback", "entity_lattice"], ["void_expansion"],
         {"space_void": 0.9, "geometry": 0.8, "machines": 0.55},
         ["rapid tunnel/chrysanthemum entry into high-frequency structure"]),
        ("dmt", "lattice_presence", "Hyperdimensional Lattice Presence", "attractor",
         ["entity_lattice", "recursive_feedback"], ["kaleidoscope"],
         {"machines": 0.85, "geometry": 0.9, "entities": 0.7},
         ["abstract lattice presence without figurative creatures"]),
        ("dmt", "chaos_to_peace", "Breakthrough Stabilization", "power",
         ["entity_lattice", "recursive_feedback"], ["organic_bloom"],
         {"space_void": 0.75, "machines": 0.6, "body_somatic": 0.4},
         ["beautiful chaos resolves toward ecstasy and peace across phases"]),
        ("5-meo-dmt", "luminous_void", "Luminous Void Dissolve", "void",
         ["void_expansion"], ["organic_bloom"],
         {"space_void": 0.95, "body_somatic": 0.5, "color_light": 0.35},
         ["minimal form, luminous depth, dissolve rather than ornate pattern"]),
        ("mescaline", "golden_clarity", "Golden Ornamental Clarity", "attractor",
         ["kaleidoscope", "recursive_feedback"], ["organic_bloom"],
         {"geometry": 0.8, "color_light": 0.75, "nature": 0.45},
         ["warm ornamental geometry with lucid contrast"]),
        ("ketamine", "smooth_corridor", "Smooth Dissociative Corridor", "void",
         ["flow_field", "void_expansion"], ["recursive_feedback"],
         {"space_void": 0.8, "body_somatic": 0.45, "geometry": 0.3},
         ["smooth depth corridors, reduced chroma chaos, floating stability"]),
        ("pcp", "pareidolic_edge", "Experimental Pareidolic Edge", "open",
         ["flow_field", "recursive_feedback"], ["organic_bloom"],
         {"entities": 0.55, "nature": 0.4, "geometry": 0.35},
         ["experimental low-intensity edge ambiguity; intensity capped"]),
    ]
    recipes = []
    for substance, slug, title, mode, primary, secondary, motifs, hooks in base:
        bias = _param_bias(motifs, substance)
        if substance == "pcp":
            for k in list(bias):
                bias[k] = round(bias[k] * 0.55, 3)
        recipes.append(
            {
                "id": f"exp_{substance.replace('-', '')}_{slug}",
                "schema_version": "1.0.0",
                "title": title,
                "substance": substance,
                "valence": "positive" if substance != "pcp" else "mixed",
                "authority": {
                    "motifs": "INFERRED",
                    "parameters": "INFERRED",
                    "source_existence": "OBSERVED",
                },
                "source_refs": [
                    {
                        "source": "curated_seed",
                        "note": "Grounded in aggregate positive phenomenology motifs",
                    }
                ],
                "motifs": motifs,
                "narrative_hooks": hooks,
                "modes": [mode, "open"],
                "visual_recipe": {
                    "primary_engines": primary,
                    "secondary_engines": secondary,
                    "mode_default": mode,
                    "palette": {
                        "tracers": TRACERS.get(substance, "#63F3E8"),
                        "energy": motifs.get("color_light", 0.6),
                        "contrast": 0.55 + 0.3 * motifs.get("geometry", 0),
                    },
                    "parameter_bias": bias,
                    "phase_profile": {
                        "comeup": {"duration_norm": 0.15, "intensity": 0.35},
                        "peak": {"duration_norm": 0.45, "intensity": 1.0},
                        "plateau": {"duration_norm": 0.25, "intensity": 0.75},
                        "comedown": {"duration_norm": 0.15, "intensity": 0.3},
                    },
                },
                "safety": {
                    "max_flash_hz": 1.5 if substance in ("dmt", "pcp") else 2.0,
                    "max_luminance_delta": 0.28 if substance == "5-meo-dmt" else 0.35,
                    "reduced_motion_compatible": True,
                    "intensity_cap": 0.55 if substance == "pcp" else 1.0,
                },
            }
        )
    return recipes


def recipes_from_files() -> list[dict]:
    out = []
    if not POS_DIR.exists():
        return out
    for path in sorted(POS_DIR.glob("*.json")):
        try:
            d = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        substance = (d.get("substance") or "unknown").lower().replace("_", "-")
        if substance == "5meo-dmt":
            substance = "5-meo-dmt"
        text = _text_of(d)
        if len(text) < 40:
            continue
        valence = _valence(text)
        if valence == "mixed" and substance != "pcp":
            # still allow if title looks constructive
            if not POS_WORDS.search(d.get("title") or ""):
                continue
        motifs = _motif_scores(text)
        if max(motifs.values() or [0]) < 0.05:
            continue
        primary, secondary, mode = _engines_for(motifs, substance)
        hooks = _hooks(text)
        title = (d.get("title") or path.stem)[:80]
        rid = f"exp_src_{substance.replace('-', '')}_{_hash(path.name)[7:15]}"
        out.append(
            {
                "id": rid,
                "schema_version": "1.0.0",
                "title": f"Derived: {title}",
                "substance": substance if substance != "unknown" else "lsd",
                "valence": "positive" if valence != "mixed" else "mixed",
                "authority": {
                    "motifs": "INFERRED",
                    "parameters": "INFERRED",
                    "source_existence": "OBSERVED",
                },
                "source_refs": [
                    {
                        "source": d.get("source", "file"),
                        "id_hash": _hash(path.name),
                        "title_hash": _hash(title),
                        "url_host": "erowid.org"
                        if "erowid" in (d.get("url") or "")
                        else (d.get("source") or "local"),
                    }
                ],
                "motifs": motifs,
                "narrative_hooks": hooks
                or ["derived visual motifs from curated positive phenomenology"],
                "modes": [mode, "open"],
                "visual_recipe": {
                    "primary_engines": primary,
                    "secondary_engines": secondary,
                    "mode_default": mode,
                    "palette": {
                        "tracers": TRACERS.get(substance, "#63F3E8"),
                        "energy": max(0.4, motifs.get("color_light", 0.5)),
                        "contrast": 0.5 + 0.3 * motifs.get("geometry", 0.3),
                    },
                    "parameter_bias": _param_bias(motifs, substance),
                    "phase_profile": {
                        "comeup": {"duration_norm": 0.15, "intensity": 0.35},
                        "peak": {"duration_norm": 0.45, "intensity": 1.0},
                        "plateau": {"duration_norm": 0.25, "intensity": 0.75},
                        "comedown": {"duration_norm": 0.15, "intensity": 0.3},
                    },
                },
                "safety": {
                    "max_flash_hz": 2.0,
                    "max_luminance_delta": 0.35,
                    "reduced_motion_compatible": True,
                },
            }
        )
    return out


def build_overlays(recipes: list[dict]) -> dict:
    buckets: dict[str, list] = defaultdict(list)
    for r in recipes:
        buckets[r["substance"]].append(r["motifs"])
    overlays = {}
    for substance, motif_list in buckets.items():
        avg = Counter()
        for m in motif_list:
            for k, v in m.items():
                avg[k] += v
        n = max(1, len(motif_list))
        means = {k: round(v / n, 3) for k, v in avg.items()}
        overlays[substance] = {
            "motif_means": means,
            "sample_count": len(motif_list),
            "tracers_color": TRACERS.get(substance, "#63F3E8"),
            "recommended_mode": max(
                (
                    (r.get("visual_recipe") or {}).get("mode_default", "open")
                    for r in recipes
                    if r["substance"] == substance
                ),
                key=lambda x: 1,
                default="open",
            ),
        }
    return {
        "schema_version": "1.0.0",
        "overlays": overlays,
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    recipes = seed_recipes() + recipes_from_files()
    # de-dupe by id
    seen = set()
    unique = []
    for r in recipes:
        if r["id"] in seen:
            continue
        seen.add(r["id"])
        unique.append(r)

    catalog = {
        "schema_version": "1.0.0",
        "generator": "scripts/build_experience_catalog.py",
        "disclaimer": (
            "Modeled phenomenological recipes for research/visualization only. "
            "Not medical, diagnostic, or therapeutic advice. Narrative hooks are "
            "short derived motifs, not republication of full source texts."
        ),
        "recipe_count": len(unique),
        "recipes": unique,
    }
    OUT_PATH.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    OVERLAY_PATH.write_text(json.dumps(build_overlays(unique), indent=2), encoding="utf-8")
    # also copy builtin for import fallback
    builtin = ROOT / "psyfi_core" / "experiences" / "builtin_catalog.v1.json"
    builtin.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    print(f"Wrote {len(unique)} recipes -> {OUT_PATH}")
    print(f"Overlays -> {OVERLAY_PATH}")
    by = Counter(r["substance"] for r in unique)
    print("By substance:", dict(by))


if __name__ == "__main__":
    main()
