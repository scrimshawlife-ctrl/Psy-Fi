"""Opt-in telemetry controls (disabled unless server + client consent)."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from psyfi_api.telemetry import TELEMETRY_ENABLED, telemetry

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class TelemetryOptInRequest(BaseModel):
    """Client consent toggle for local diagnostic telemetry."""

    opt_in: bool = Field(
        description="When true and PSYFI_TELEMETRY_ENABLED=1, events may be buffered locally."
    )


class TelemetryStatus(BaseModel):
    """Current telemetry gate state."""

    server_enabled: bool
    client_opt_in: bool
    active: bool
    event_count: int
    note: str


@router.get("/status", response_model=TelemetryStatus)
async def telemetry_status() -> TelemetryStatus:
    """Return whether telemetry is active."""
    events = telemetry.snapshot()
    return TelemetryStatus(
        server_enabled=TELEMETRY_ENABLED,
        client_opt_in=telemetry.client_opt_in,
        active=telemetry.active,
        event_count=len(events),
        note=(
            "Telemetry never leaves the process unless a future governed sink is added. "
            "Both PSYFI_TELEMETRY_ENABLED and client opt-in are required."
        ),
    )


@router.post("/opt-in", response_model=TelemetryStatus)
async def set_telemetry_opt_in(body: TelemetryOptInRequest) -> TelemetryStatus:
    """Set client opt-in. Still no-op unless the server env flag is enabled."""
    telemetry.client_opt_in = body.opt_in
    if not body.opt_in:
        telemetry.clear()
    return await telemetry_status()


@router.get("/events")
async def list_telemetry_events() -> dict:
    """List locally buffered events (empty unless active)."""
    return {"active": telemetry.active, "events": telemetry.snapshot()}
