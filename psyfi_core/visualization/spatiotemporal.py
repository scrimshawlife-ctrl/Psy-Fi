"""Optional spatiotemporal anchors for image-seed / export-journey (I3).

Deterministic, presentation/provenance only — never authoritative over ParameterField
or simulation truth. Solar elevation may be user-provided (OBSERVED) or derived
(INFERRED) from lat/lon + year + hour.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

SPATIOTEMPORAL_SCHEMA = "psyfi.spatiotemporal_anchor.v1"


def _clamp(v: float, lo: float, hi: float) -> float:
    return float(max(lo, min(hi, v)))


def _as_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n):
        return None
    return n


def _as_int(value: Any) -> int | None:
    n = _as_float(value)
    if n is None:
        return None
    return int(round(n))


def day_of_year_from_year_hour(year: int | None, hour: float | None) -> int | None:
    """Map year + fractional hour into a stable day-of-year stand-in when ISO is absent.

    Uses day 172 (near solstice) as the default mid-year plate so solar elevation
    remains defined and deterministic without a full calendar date.
    """
    if year is None and hour is None:
        return None
    # Fixed research plate day — documented; not a claim about local civil time.
    return 172


def parse_iso_timestamp(iso_timestamp: str | None) -> tuple[int | None, float | None, int | None]:
    """Return (year, hour_utc_fraction, day_of_year) from an ISO-8601 string."""
    if not iso_timestamp or not str(iso_timestamp).strip():
        return None, None, None
    raw = str(iso_timestamp).strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        return None, None, None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt_utc = dt.astimezone(timezone.utc)
    hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    return dt_utc.year, hour, int(dt_utc.timetuple().tm_yday)


def solar_elevation_deg(
    *,
    latitude: float,
    longitude: float,
    day_of_year: int,
    hour: float,
) -> float:
    """Approximate solar elevation (degrees) — deterministic research plate.

    Closed-form approximation (no ephemeris tables). Sufficient for lighting bias /
    prompt sidecars; not a navigational product.
    """
    lat = math.radians(_clamp(latitude, -90.0, 90.0))
    lon = _clamp(longitude, -180.0, 180.0)
    doy = int(max(1, min(366, day_of_year)))
    hr = hour % 24.0

    # Solar declination (radians) — Cooper equation.
    decl = math.radians(23.45) * math.sin(2.0 * math.pi * (284 + doy) / 365.0)
    # Longitude as a crude timezone offset so same UTC hour differs by place.
    local_hour = (hr + lon / 15.0) % 24.0
    hour_angle = math.radians((local_hour - 12.0) * 15.0)
    sin_el = math.sin(lat) * math.sin(decl) + math.cos(lat) * math.cos(decl) * math.cos(hour_angle)
    sin_el = _clamp(sin_el, -1.0, 1.0)
    return round(math.degrees(math.asin(sin_el)), 4)


def normalize_anchors(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    """Normalize optional anchor fields into psyfi.spatiotemporal_anchor.v1.

    Returns None when no usable spatiotemporal signal is present.
    """
    if not raw or not isinstance(raw, dict):
        return None

    latitude = _as_float(raw.get("latitude"))
    longitude = _as_float(raw.get("longitude"))
    year = _as_int(raw.get("year"))
    hour = _as_float(raw.get("hour"))
    iso_timestamp = raw.get("iso_timestamp") or raw.get("timestamp")
    iso_timestamp = str(iso_timestamp).strip() if iso_timestamp else None
    provided_elev = _as_float(raw.get("solar_elevation_deg") if "solar_elevation_deg" in raw else raw.get("solar_elevation"))

    iso_year, iso_hour, iso_doy = parse_iso_timestamp(iso_timestamp)
    if year is None:
        year = iso_year
    if hour is None:
        hour = iso_hour
    day_of_year = _as_int(raw.get("day_of_year")) or iso_doy
    if day_of_year is None:
        day_of_year = day_of_year_from_year_hour(year, hour)

    if latitude is not None:
        latitude = _clamp(latitude, -90.0, 90.0)
    if longitude is not None:
        longitude = _clamp(longitude, -180.0, 180.0)
    if hour is not None:
        hour = hour % 24.0
    if year is not None:
        year = int(max(1, min(9999, year)))
    if provided_elev is not None:
        provided_elev = _clamp(provided_elev, -90.0, 90.0)

    solar_elevation = provided_elev
    solar_source: str | None = "provided" if provided_elev is not None else None
    if (
        solar_elevation is None
        and latitude is not None
        and longitude is not None
        and day_of_year is not None
        and hour is not None
    ):
        solar_elevation = solar_elevation_deg(
            latitude=latitude,
            longitude=longitude,
            day_of_year=int(day_of_year),
            hour=float(hour),
        )
        solar_source = "derived"

    has_signal = any(
        v is not None
        for v in (latitude, longitude, year, hour, iso_timestamp, solar_elevation)
    )
    if not has_signal:
        return None

    claim = "OBSERVED"
    if solar_source == "derived" and provided_elev is None:
        # Mixed packet: coordinates OBSERVED, elevation INFERRED — label packet INFERRED.
        claim = "INFERRED"

    return {
        "schema": SPATIOTEMPORAL_SCHEMA,
        "claim": claim,
        "latitude": round(latitude, 6) if latitude is not None else None,
        "longitude": round(longitude, 6) if longitude is not None else None,
        "year": year,
        "hour": round(float(hour), 4) if hour is not None else None,
        "iso_timestamp": iso_timestamp,
        "day_of_year": int(day_of_year) if day_of_year is not None else None,
        "solar_elevation_deg": round(float(solar_elevation), 4) if solar_elevation is not None else None,
        "solar_elevation_source": solar_source,
    }


def apply_anchor_drive_bias(drive: dict[str, float], anchors: dict[str, Any] | None) -> dict[str, float]:
    """Subtle lighting bias from solar elevation — presentation conditioner only."""
    if not anchors or anchors.get("solar_elevation_deg") is None:
        return drive
    elev = float(anchors["solar_elevation_deg"])
    # Map elevation [-90,90] → day factor [0,1]
    day = _clamp((elev + 18.0) / 90.0, 0.0, 1.0)
    out = dict(drive)
    out["palette_energy"] = _clamp(out.get("palette_energy", 0.5) + 0.08 * (day - 0.5), 0.0, 1.0)
    out["bloom"] = _clamp(out.get("bloom", 0.25) + 0.06 * (day - 0.45), 0.0, 1.0)
    out["void_bias"] = _clamp(out.get("void_bias", 0.0) + 0.07 * (0.55 - day), 0.0, 1.0)
    return out


def apply_anchor_hint_bias(hints: dict[str, float], anchors: dict[str, Any] | None) -> dict[str, float]:
    """Tiny Pass-2 hint nudges from solar elevation (still SafetyPass-capped downstream)."""
    if not anchors or anchors.get("solar_elevation_deg") is None:
        return hints
    elev = float(anchors["solar_elevation_deg"])
    day = _clamp((elev + 18.0) / 90.0, 0.0, 1.0)
    out = dict(hints)
    out["palette_energy"] = round(_clamp(out.get("palette_energy", 0.0) + 0.03 * (day - 0.5), 0.0, 1.0), 4)
    out["bloom"] = round(_clamp(out.get("bloom", 0.0) + 0.025 * (day - 0.45), 0.0, 1.0), 4)
    out["void_bias"] = round(_clamp(out.get("void_bias", 0.0) + 0.03 * (0.55 - day), 0.0, 1.0), 4)
    return out


def solar_day_factor(anchors: dict[str, Any] | None) -> float | None:
    """Map solar elevation to a 0–1 day factor for live lighting modulators.

    Returns None when anchors lack solar elevation. 0 ≈ night, 1 ≈ high sun.
    """
    if not anchors or anchors.get("solar_elevation_deg") is None:
        return None
    elev = float(anchors["solar_elevation_deg"])
    return round(_clamp((elev + 18.0) / 90.0, 0.0, 1.0), 4)


def format_anchor_prompt_clause(anchors: dict[str, Any] | None) -> str:
    """Short T2V / planner lighting clause from anchors."""
    if not anchors:
        return ""
    parts: list[str] = []
    lat = anchors.get("latitude")
    lon = anchors.get("longitude")
    if lat is not None and lon is not None:
        parts.append(f"grounded near {lat:.2f}°, {lon:.2f}°")
    year = anchors.get("year")
    hour = anchors.get("hour")
    if year is not None:
        parts.append(f"year {year}")
    if hour is not None:
        parts.append(f"hour {float(hour):.1f}")
    elev = anchors.get("solar_elevation_deg")
    src = anchors.get("solar_elevation_source")
    if elev is not None:
        label = "derived" if src == "derived" else "set"
        parts.append(f"solar elevation {float(elev):.1f}° ({label})")
    if not parts:
        return ""
    return "Spatiotemporal plate: " + ", ".join(parts) + "."
