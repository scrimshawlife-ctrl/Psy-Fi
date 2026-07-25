"""Tests for interruptible simulation and job cancellation."""

import time

from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.abx_core.errors import SimulationCancelled
from psyfi_core.engines import ConsciousnessOmegaParams, evolve_consciousness_omega
import numpy as np


def test_evolve_respects_should_cancel() -> None:
    field = np.ones((8, 8), dtype=np.complex64)
    params = ConsciousnessOmegaParams(steps=50, dt=0.1)
    calls = {"n": 0}

    def should_cancel() -> bool:
        calls["n"] += 1
        return calls["n"] > 3

    try:
        evolve_consciousness_omega(field, params, should_cancel=should_cancel)
        assert False, "expected SimulationCancelled"
    except SimulationCancelled as exc:
        assert "cancelled" in str(exc).lower()


def test_job_create_complete_and_cancel() -> None:
    with TestClient(app) as client:
        created = client.post(
            "/api/jobs/simulate",
            json={"width": 24, "height": 24, "steps": 8, "seed": 3},
        )
        assert created.status_code == 200
        job_id = created.json()["id"]

        deadline = time.time() + 5
        final = None
        while time.time() < deadline:
            poll = client.get(f"/api/jobs/{job_id}")
            assert poll.status_code == 200
            final = poll.json()
            if final["status"] in {"completed", "failed", "cancelled"}:
                break
            time.sleep(0.05)

        assert final is not None
        assert final["status"] == "completed"
        assert final["result"]["seed"] == 3

        # Long job then cancel
        long_job = client.post(
            "/api/jobs/simulate",
            json={"width": 64, "height": 64, "steps": 400, "seed": 1},
        )
        long_id = long_job.json()["id"]
        cancelled = client.delete(f"/api/jobs/{long_id}")
        assert cancelled.status_code == 200

        deadline = time.time() + 5
        status = None
        while time.time() < deadline:
            status = client.get(f"/api/jobs/{long_id}").json()["status"]
            if status in {"cancelled", "completed", "failed"}:
                break
            time.sleep(0.05)
        assert status == "cancelled"


def test_ready_and_telemetry_gates() -> None:
    with TestClient(app) as client:
        ready = client.get("/ready")
        assert ready.status_code == 200
        payload = ready.json()
        assert payload["status"] == "ready"
        assert payload["checks"]["presets_loaded"] is True
        assert payload["checks"]["icon_192"] is True

        status = client.get("/api/telemetry/status").json()
        assert status["server_enabled"] is False
        assert status["active"] is False

        opted = client.post("/api/telemetry/opt-in", json={"opt_in": True}).json()
        assert opted["client_opt_in"] is True
        assert opted["active"] is False  # server flag still off
