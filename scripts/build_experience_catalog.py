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
        ("5-meo-dmt", "whiteout_stillness", "Whiteout Stillness Field", "void",
         ["void_expansion", "organic_bloom"], ["flow_field"],
         {"space_void": 0.92, "color_light": 0.55, "body_somatic": 0.45, "geometry": 0.15},
         ["near-formless luminance with soft somatic dissolve; pattern complexity stays low"]),
        ("5-meo-dmt", "breath_abyss", "Breath-Coupled Abyss", "open",
         ["void_expansion", "flow_field"], ["organic_bloom"],
         {"space_void": 0.85, "body_somatic": 0.7, "time_memory": 0.4},
         ["slow breath-linked expansion into depth without ornate lattice"]),
        ("mescaline", "golden_clarity", "Golden Ornamental Clarity", "attractor",
         ["kaleidoscope", "recursive_feedback"], ["organic_bloom"],
         {"geometry": 0.8, "color_light": 0.75, "nature": 0.45},
         ["warm ornamental geometry with lucid contrast"]),
        ("mescaline", "desert_geometry", "Desert Geometry Bloom", "attractor",
         ["kaleidoscope", "organic_bloom"], ["recursive_feedback"],
         {"geometry": 0.75, "nature": 0.7, "color_light": 0.65},
         ["sunlit ornamental clarity; plant and textile geometry with stable edges"]),
        ("mescaline", "lucid_tracers", "Lucid Golden Tracers", "open",
         ["recursive_feedback", "kaleidoscope"], ["flow_field"],
         {"color_light": 0.85, "geometry": 0.6, "time_memory": 0.35},
         ["long warm tracers with lucid attentional hold and low panic valence"]),
        ("ketamine", "smooth_corridor", "Smooth Dissociative Corridor", "void",
         ["flow_field", "void_expansion"], ["recursive_feedback"],
         {"space_void": 0.8, "body_somatic": 0.45, "geometry": 0.3},
         ["smooth depth corridors, reduced chroma chaos, floating stability"]),
        ("ketamine", "k_hole_drift", "K-Hole Soft Drift", "void",
         ["void_expansion", "flow_field"], ["organic_bloom"],
         {"space_void": 0.9, "body_somatic": 0.55, "time_memory": 0.5, "geometry": 0.2},
         ["detached floating drift; sparse structure and muted chroma"]),
        ("ketamine", "mirror_hallway", "Mirror Hallway Softening", "open",
         ["flow_field", "recursive_feedback"], ["void_expansion"],
         {"space_void": 0.65, "geometry": 0.4, "color_light": 0.35, "body_somatic": 0.4},
         ["soft repeating corridors with low edge aggression and calm detachment"]),
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


ENGINE_KEYS = (
    "recursive_feedback",
    "kaleidoscope",
    "flow_field",
    "organic_bloom",
    "void_expansion",
    "entity_lattice",
    "neutral_view",
)


def _oscillation_style(means: dict[str, float], substance: str) -> str:
    """Infer oscillation style from distilled motif means + substance priors."""
    g = means.get("geometry", 0.0)
    n = means.get("nature", 0.0)
    m = means.get("machines", 0.0)
    v = means.get("space_void", 0.0)
    e = means.get("entities", 0.0)
    if substance == "pcp":
        return "unstable"
    if substance == "ketamine" or (v > 0.55 and g < 0.4 and m < 0.35):
        return "smooth" if substance == "ketamine" else "minimal"
    if substance in ("5-meo-dmt",) or (v >= 0.7 and g < 0.45 and m < 0.35):
        return "minimal"
    if m >= 0.35 or e >= 0.45 or (substance == "dmt" and v >= 0.35):
        return "fractal"
    if n >= g and n >= 0.35:
        return "organic"
    if g >= 0.35:
        return "geometric"
    return "organic" if substance == "psilocybin" else "geometric"


def _visual_signature(means: dict[str, float], substance: str, style: str) -> dict:
    """Distill scalar visual settings used by parameter_mapper / presets."""
    g = means.get("geometry", 0.35)
    c = means.get("color_light", 0.4)
    v = means.get("space_void", 0.3)
    m = means.get("machines", 0.1)
    n = means.get("nature", 0.2)
    complexity = min(1.0, 0.3 + 0.55 * max(g, m) + 0.2 * v)
    if substance == "pcp":
        complexity *= 0.55
    return {
        "tracers_color": TRACERS.get(substance, "#63F3E8"),
        "tracers_length": round(min(1.0, 0.25 + 0.65 * c + 0.15 * g), 3),
        "oscillation_style": style,
        "symmetry_bias": round(min(1.0, 0.2 + 0.7 * g + 0.1 * m), 3),
        "depth_distortion": round(min(1.0, 0.2 + 0.7 * v + 0.15 * m), 3),
        "color_enhancement": round(min(1.0, 0.25 + 0.7 * c + 0.1 * n), 3),
        "pattern_complexity": round(complexity, 3),
    }


def _avg_engine_weights(substance_recipes: list[dict]) -> dict[str, float]:
    weights = {k: 0.0 for k in ENGINE_KEYS}
    for recipe in substance_recipes:
        visual = recipe.get("visual_recipe") or {}
        for i, eng in enumerate(visual.get("primary_engines") or []):
            key = str(eng).replace("-", "_")
            if key in weights:
                weights[key] += max(0.35, 0.9 - 0.12 * i)
        for i, eng in enumerate(visual.get("secondary_engines") or []):
            key = str(eng).replace("-", "_")
            if key in weights:
                weights[key] += max(0.15, 0.5 - 0.08 * i)
    total = sum(weights.values()) or 1.0
    return {k: round(v / total, 4) for k, v in weights.items()}


def _avg_parameter_bias(substance_recipes: list[dict]) -> dict[str, float]:
    sums: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for recipe in substance_recipes:
        bias = ((recipe.get("visual_recipe") or {}).get("parameter_bias")) or {}
        for key, value in bias.items():
            sums[key] += float(value)
            counts[key] += 1
    return {k: round(sums[k] / max(1, counts[k]), 3) for k in sorted(sums)}


def _avg_palette(substance_recipes: list[dict], substance: str) -> dict:
    energies = []
    contrasts = []
    for recipe in substance_recipes:
        pal = ((recipe.get("visual_recipe") or {}).get("palette")) or {}
        if pal.get("energy") is not None:
            energies.append(float(pal["energy"]))
        if pal.get("contrast") is not None:
            contrasts.append(float(pal["contrast"]))
    return {
        "tracers": TRACERS.get(substance, "#63F3E8"),
        "energy": round(sum(energies) / len(energies), 3) if energies else 0.5,
        "contrast": round(sum(contrasts) / len(contrasts), 3) if contrasts else 0.55,
    }


def _avg_phase_profile(substance_recipes: list[dict]) -> dict:
    phases = ("comeup", "peak", "plateau", "comedown")
    defaults = {
        "comeup": {"duration_norm": 0.15, "intensity": 0.35},
        "peak": {"duration_norm": 0.45, "intensity": 1.0},
        "plateau": {"duration_norm": 0.25, "intensity": 0.75},
        "comedown": {"duration_norm": 0.15, "intensity": 0.3},
    }
    out = {}
    for phase in phases:
        durs = []
        ints = []
        for recipe in substance_recipes:
            cfg = ((recipe.get("visual_recipe") or {}).get("phase_profile") or {}).get(phase) or {}
            if cfg.get("duration_norm") is not None:
                durs.append(float(cfg["duration_norm"]))
            if cfg.get("intensity") is not None:
                ints.append(float(cfg["intensity"]))
        out[phase] = {
            "duration_norm": round(sum(durs) / len(durs), 3) if durs else defaults[phase]["duration_norm"],
            "intensity": round(sum(ints) / len(ints), 3) if ints else defaults[phase]["intensity"],
        }
    return out


def build_overlays(recipes: list[dict]) -> dict:
    """Distill per-substance visual settings from scraped/seed experience recipes."""
    buckets: dict[str, list[dict]] = defaultdict(list)
    for recipe in recipes:
        buckets[recipe["substance"]].append(recipe)

    overlays = {}
    for substance, substance_recipes in sorted(buckets.items()):
        motif_list = [r.get("motifs") or {} for r in substance_recipes]
        avg = Counter()
        for motifs in motif_list:
            for key, value in motifs.items():
                avg[key] += float(value)
        n = max(1, len(motif_list))
        means = {k: round(v / n, 3) for k, v in avg.items()}
        style = _oscillation_style(means, substance)
        mode_counts = Counter(
            (r.get("visual_recipe") or {}).get("mode_default", "open") for r in substance_recipes
        )
        recommended_mode = mode_counts.most_common(1)[0][0] if mode_counts else "open"
        primary, secondary, _mode = _engines_for(means, substance)
        overlays[substance] = {
            "schema_version": "1.0.0",
            "substance": substance,
            "authority": {
                "motifs": "INFERRED",
                "parameters": "INFERRED",
                "source_existence": "OBSERVED",
            },
            "motif_means": means,
            "sample_count": len(substance_recipes),
            "tracers_color": TRACERS.get(substance, "#63F3E8"),
            "recommended_mode": recommended_mode,
            "oscillation_style": style,
            "visual_signature": _visual_signature(means, substance, style),
            "engine_weights": _avg_engine_weights(substance_recipes),
            "primary_engines": primary,
            "secondary_engines": secondary,
            "parameter_bias": _avg_parameter_bias(substance_recipes),
            "palette": _avg_palette(substance_recipes, substance),
            "phase_profile": _avg_phase_profile(substance_recipes),
            "safety": {
                "max_flash_hz": 1.5 if substance in ("dmt", "pcp") else 2.0,
                "max_luminance_delta": 0.28 if substance == "5-meo-dmt" else 0.35,
                "intensity_cap": 0.55 if substance == "pcp" else 1.0,
            },
        }
    return {
        "schema_version": "1.0.0",
        "generator": "scripts/build_experience_catalog.py",
        "disclaimer": (
            "Distilled visual settings from curated phenomenology recipes. "
            "INFERRED parameters for research/visualization only — not medical advice."
        ),
        "overlays": overlays,
    }


def sync_preset_visual_signatures(overlays: dict) -> list[str]:
    """Push distilled visual_signature scalars into substance_presets.json."""
    presets_path = ROOT / "psyfi_core" / "presets" / "substance_presets.json"
    if not presets_path.exists():
        return []
    data = json.loads(presets_path.read_text(encoding="utf-8"))
    updated: list[str] = []
    for key, preset in (data.get("presets") or {}).items():
        sid = key.lower().replace("_", "-")
        overlay = overlays.get(sid)
        if overlay is None and sid == "5meo-dmt":
            overlay = overlays.get("5-meo-dmt")
        if not overlay:
            continue
        sig = overlay.get("visual_signature") or {}
        if not sig:
            continue
        preset["visual_signature"] = {
            "tracers_color": sig["tracers_color"],
            "tracers_length": sig["tracers_length"],
            "oscillation_style": sig["oscillation_style"],
            "symmetry_bias": sig["symmetry_bias"],
            "depth_distortion": sig["depth_distortion"],
            "color_enhancement": sig["color_enhancement"],
            "pattern_complexity": sig["pattern_complexity"],
        }
        updated.append(key)
    presets_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return updated


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
    overlay_doc = build_overlays(unique)
    OUT_PATH.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    OVERLAY_PATH.write_text(json.dumps(overlay_doc, indent=2), encoding="utf-8")
    # also copy builtin for import fallback
    builtin = ROOT / "psyfi_core" / "experiences" / "builtin_catalog.v1.json"
    builtin.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    synced = sync_preset_visual_signatures(overlay_doc.get("overlays") or {})
    print(f"Wrote {len(unique)} recipes -> {OUT_PATH}")
    print(f"Overlays -> {OVERLAY_PATH}")
    if synced:
        print(f"Synced visual_signature into presets: {', '.join(synced)}")
    by = Counter(r["substance"] for r in unique)
    print("By substance:", dict(by))


if __name__ == "__main__":
    main()
