"""Privacy-preserving telemetry stub (disabled by default).

No network export occurs until governance explicitly enables a sink.
Events are retained in-process only for local diagnostics.
"""

from __future__ import annotations

import os
import threading
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


TELEMETRY_ENABLED = _env_flag("PSYFI_TELEMETRY_ENABLED", default=False)
TELEMETRY_MAX_EVENTS = int(os.getenv("PSYFI_TELEMETRY_MAX_EVENTS", "200"))


@dataclass(frozen=True)
class TelemetryEvent:
    name: str
    timestamp: str
    props: dict[str, Any]


class TelemetryBuffer:
    """Ring buffer for local, non-identifying diagnostic events."""

    def __init__(self, maxlen: int = TELEMETRY_MAX_EVENTS) -> None:
        self._events: deque[TelemetryEvent] = deque(maxlen=maxlen)
        self._lock = threading.Lock()
        self.client_opt_in = False

    @property
    def active(self) -> bool:
        return TELEMETRY_ENABLED and self.client_opt_in

    def emit(self, name: str, **props: Any) -> bool:
        """Record an event when both server flag and client opt-in are true."""
        if not self.active:
            return False
        # Strip anything that looks sensitive.
        safe_props = {
            key: value
            for key, value in props.items()
            if key
            not in {
                "ip",
                "user_agent",
                "email",
                "token",
                "authorization",
                "cookie",
                "field",
                "values",
            }
        }
        event = TelemetryEvent(
            name=name,
            timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            props=safe_props,
        )
        with self._lock:
            self._events.append(event)
        return True

    def snapshot(self) -> list[dict[str, Any]]:
        with self._lock:
            return [
                {"name": e.name, "timestamp": e.timestamp, "props": e.props}
                for e in list(self._events)
            ]

    def clear(self) -> None:
        with self._lock:
            self._events.clear()


telemetry = TelemetryBuffer()
