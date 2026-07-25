"""Cancellable simulation jobs backed by the in-process job store."""

from __future__ import annotations

import threading
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from psyfi_api.jobs import job_store
from psyfi_api.simulation_service import PresetNotFoundError, run_simulation
from psyfi_api.telemetry import telemetry
from psyfi_core.abx_core.errors import SimulationCancelled

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobCreateRequest(BaseModel):
    """Create a background simulation job."""

    width: int = Field(default=64, ge=8, le=512)
    height: int = Field(default=64, ge=8, le=512)
    steps: int = Field(default=10, ge=1, le=1000)
    seed: int | None = Field(default=None, ge=0, le=2**32 - 1)
    preset: str | None = None


class JobSummary(BaseModel):
    """Job status payload."""

    id: str
    status: str
    created_at: str
    updated_at: str
    request: dict[str, Any]
    error: str | None = None
    result: dict[str, Any] | None = None


def _run_job(job_id: str) -> None:
    job = job_store.get(job_id)
    if job is None:
        return
    job.status = "running"
    job.touch()
    try:
        result = run_simulation(
            width=int(job.request["width"]),
            height=int(job.request["height"]),
            steps=int(job.request["steps"]),
            seed=job.request.get("seed"),
            preset=job.request.get("preset"),
            should_cancel=job.cancel_event.is_set,
        )
        # Prefer cancel if it was requested at any point during the run.
        if job.cancel_event.is_set():
            job.status = "cancelled"
            job.error = job.error or "Simulation cancelled"
            job.result = None
            telemetry.emit("simulate_cancelled", mode="job", job_id=job.id)
        else:
            job.result = result
            job.status = "completed"
            telemetry.emit(
                "simulate_completed",
                mode="job",
                job_id=job.id,
                width=job.request["width"],
                height=job.request["height"],
                steps=job.request["steps"],
            )
    except SimulationCancelled as exc:
        job.status = "cancelled"
        job.error = str(exc)
        telemetry.emit("simulate_cancelled", mode="job", job_id=job.id)
    except PresetNotFoundError as exc:
        job.status = "failed"
        job.error = str(exc)
    except Exception as exc:  # noqa: BLE001 - surface worker failures to clients
        job.status = "failed"
        job.error = str(exc)
    finally:
        job.touch()


@router.post("/simulate", response_model=JobSummary)
async def create_simulate_job(body: JobCreateRequest) -> JobSummary:
    """Start a cancellable simulation job in a worker thread."""
    job = job_store.create(body.model_dump())
    thread = threading.Thread(target=_run_job, args=(job.id,), daemon=True)
    thread.start()
    telemetry.emit("simulate_job_created", job_id=job.id, steps=body.steps)
    return JobSummary(
        id=job.id,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        request=job.request,
        error=job.error,
        result=job.result,
    )


@router.get("/{job_id}", response_model=JobSummary)
async def get_job(job_id: str) -> JobSummary:
    """Fetch job status/result."""
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobSummary(
        id=job.id,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        request=job.request,
        error=job.error,
        result=job.result,
    )


@router.delete("/{job_id}", response_model=JobSummary)
async def cancel_job(job_id: str) -> JobSummary:
    """Request cancellation of a queued/running job."""
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    job.request_cancel()
    return JobSummary(
        id=job.id,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        request=job.request,
        error=job.error,
        result=job.result,
    )
