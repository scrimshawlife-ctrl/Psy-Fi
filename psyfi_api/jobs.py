"""In-process simulation job store for cancellable async runs."""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal


JobStatus = Literal["queued", "running", "completed", "cancelled", "failed"]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass
class SimulationJob:
    """Mutable job record shared between API threads."""

    id: str
    status: JobStatus = "queued"
    created_at: str = field(default_factory=_utc_now)
    updated_at: str = field(default_factory=_utc_now)
    request: dict[str, Any] = field(default_factory=dict)
    result: dict[str, Any] | None = None
    error: str | None = None
    cancel_event: threading.Event = field(default_factory=threading.Event)

    def touch(self) -> None:
        self.updated_at = _utc_now()

    def request_cancel(self) -> None:
        self.cancel_event.set()
        if self.status in {"queued", "running"}:
            self.status = "cancelled"
            self.touch()


class JobStore:
    """Thread-safe in-memory job registry (single-process deployments)."""

    def __init__(self) -> None:
        self._jobs: dict[str, SimulationJob] = {}
        self._lock = threading.Lock()

    def create(self, request: dict[str, Any]) -> SimulationJob:
        job = SimulationJob(id=f"job_{uuid.uuid4().hex[:12]}", request=request)
        with self._lock:
            self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> SimulationJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def list_recent(self, limit: int = 20) -> list[SimulationJob]:
        with self._lock:
            jobs = sorted(self._jobs.values(), key=lambda j: j.created_at, reverse=True)
            return jobs[:limit]


job_store = JobStore()
