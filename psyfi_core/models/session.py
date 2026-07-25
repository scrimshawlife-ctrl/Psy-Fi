"""Versioned PsyFi session contracts for save/restore/export."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


SESSION_SCHEMA_VERSION = "psyfi.session.v1"
VISUALIZATION_SCHEMA_VERSION = "psyfi.visualization.v1"


def utc_now_iso() -> str:
    """Return an ISO-8601 UTC timestamp with Z suffix."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class SessionParameters(BaseModel):
    """Canonical parameters required to reproduce a simulation."""

    width: int = Field(ge=8, le=512)
    height: int = Field(ge=8, le=512)
    steps: int = Field(ge=1, le=1000)
    coupling_strength: float = Field(default=0.5, ge=0.0, le=2.0)
    normalization_P: float = Field(default=1.0)
    normalization_V: float = Field(default=1.0)
    phase_noise: float | None = Field(default=None, ge=0.0, le=1.0)
    phase_reset_strength: float | None = Field(default=None, ge=0.0, le=1.0)
    drift_amplitude: float | None = Field(default=None, ge=0.0, le=1.0)
    drift_velocity: float | None = Field(default=None, ge=0.0, le=1.0)


class SessionProvenance(BaseModel):
    """Portable provenance subset derived from ABX ProvenanceRecord."""

    id: str = Field(min_length=1)
    module_chain: list[str] = Field(default_factory=list)
    parameters: dict[str, Any] = Field(default_factory=dict)
    meta: dict[str, Any] = Field(default_factory=dict)


class SessionMetrics(BaseModel):
    """Public metric bundle aligned with SimulateResponse."""

    valence: float
    coherence: float
    symmetry: float
    roughness: float
    richness: float


class SessionResult(BaseModel):
    """Optional result payload attached after a successful run."""

    metrics: SessionMetrics
    checksum: str | None = None
    visualization_ref: str | None = None


class PsyFiSession(BaseModel):
    """Deterministic session document shared by web and future iOS clients."""

    schema_version: str = Field(default=SESSION_SCHEMA_VERSION)
    engine_version: str = Field(default="0.1.0")
    api_version: str = Field(default="v0")
    abx_core: str = Field(default="1.3")
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)
    seed: int = Field(ge=0, le=2**32 - 1)
    preset: str | None = None
    parameters: SessionParameters
    provenance: SessionProvenance
    result: SessionResult | None = None
    assumptions: list[str] = Field(
        default_factory=lambda: [
            "Outputs are modeled simulation metrics, not medical findings.",
            "Reproducibility requires the recorded seed, engine version, and parameters.",
        ]
    )
    labels: dict[str, str] = Field(default_factory=dict)

    @classmethod
    def from_simulation(
        cls,
        *,
        seed: int,
        width: int,
        height: int,
        steps: int,
        metrics: SessionMetrics,
        module_chain: list[str],
        provenance_parameters: dict[str, Any] | None = None,
        provenance_meta: dict[str, Any] | None = None,
        coupling_strength: float = 0.5,
        normalization_P: float = 1.0,
        normalization_V: float = 1.0,
        engine_version: str = "0.1.0",
        api_version: str = "v0",
    ) -> "PsyFiSession":
        """Build a session document from an existing simulation run."""
        now = utc_now_iso()
        return cls(
            engine_version=engine_version,
            api_version=api_version,
            created_at=now,
            updated_at=now,
            seed=seed,
            parameters=SessionParameters(
                width=width,
                height=height,
                steps=steps,
                coupling_strength=coupling_strength,
                normalization_P=normalization_P,
                normalization_V=normalization_V,
            ),
            provenance=SessionProvenance(
                id=f"prov_{uuid4().hex[:12]}",
                module_chain=module_chain,
                parameters=provenance_parameters or {},
                meta=provenance_meta or {},
            ),
            result=SessionResult(metrics=metrics),
        )


class VisualizationChannel(BaseModel):
    """One renderable channel in a platform-neutral visualization scene."""

    id: str
    role: str = Field(pattern="^(magnitude|phase|valence|coherence|custom)$")
    units: str
    palette: str | None = None
    blend: str = Field(default="replace", pattern="^(replace|add|multiply|screen)$")


class VisualizationAccessibility(BaseModel):
    """Accessibility contract required for every canonical visualization."""

    summary: str = Field(min_length=1)
    legend: list[dict[str, str]] = Field(default_factory=list)
    high_contrast_palette: str | None = None
    reduced_motion_alternative: str = Field(min_length=1)
    downloadable_data_ref: str | None = None


class PsyFiVisualization(BaseModel):
    """Renderer-independent visualization schema (Canvas/WebGL/WebGPU/Metal)."""

    schema_version: str = Field(default=VISUALIZATION_SCHEMA_VERSION)
    provenance_id: str
    sequence_id: str | None = None
    frame_index: int | None = Field(default=None, ge=0)
    field: dict[str, Any]
    channels: list[VisualizationChannel]
    layers: list[dict[str, Any]] = Field(default_factory=list)
    view: dict[str, Any] = Field(default_factory=dict)
    renderer_requirements: dict[str, Any] = Field(
        default_factory=lambda: {
            "baseline": "canvas2d",
            "optional_acceleration": ["webgl", "webgpu"],
        }
    )
    accessibility: VisualizationAccessibility
