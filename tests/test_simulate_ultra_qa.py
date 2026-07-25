"""Simulated P0 Ultra desktop QA — API + /gpu/ mount + G4 seed snapshots."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from psyfi_api.main import app

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "tests" / "fixtures" / "qa" / "simulated_ultra_qa.v1.json"

client = TestClient(app)

G4_SEEDS = [
    {"substance": "lsd", "mode": "open", "seed": 42, "intensity": 0.75},
    {"substance": "psilocybin", "mode": "attractor", "seed": 7, "intensity": 0.6},
    {"substance": "dmt", "mode": "void", "seed": 99, "intensity": 0.85},
]


def test_simulated_ultra_qa_api_and_gpu_shell() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

    ready = client.get("/ready")
    assert ready.status_code == 200

    gpu = client.get("/gpu/")
    assert gpu.status_code == 200
    assert "text/html" in gpu.headers.get("content-type", "")
    assert len(gpu.content) > 100

    checks = [
        {"id": "health", "ok": True, "detail": "healthy"},
        {"id": "ready", "ok": True, "detail": str(ready.status_code)},
        {"id": "gpu-shell", "ok": True, "detail": f"status={gpu.status_code} bytes={len(gpu.content)}"},
    ]

    hashes: list[str] = []
    for seed in G4_SEEDS:
        res = client.post(
            "/api/v1/visualize/scene-snapshot",
            json={
                **seed,
                "quality_tier": "ultra",
                "sequence": 1,
                "include_simulation": False,
            },
        )
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["quality_tier"] == "ultra"
        assert body["post"].get("ssr") is True
        assert body["post"].get("ssao") is True
        assert body["procedural"]["crystals"]
        hashes.append(body["parameter_field"]["hash"])
        checks.append(
            {
                "id": f"snapshot-{seed['substance']}",
                "ok": True,
                "detail": (
                    f"tier=ultra ssr={body['post'].get('ssr')} "
                    f"crystals={len(body['procedural']['crystals'])} "
                    f"hash={body['parameter_field']['hash'][:8]}"
                ),
            }
        )

    assert len(set(hashes)) == len(hashes)

    # Neutral view collapses expensive post (safety calm check).
    neutral = client.post(
        "/api/v1/visualize/scene-snapshot",
        json={
            "substance": "lsd",
            "mode": "open",
            "seed": 42,
            "intensity": 0.75,
            "quality_tier": "ultra",
            "neutral_view": True,
            "sequence": 2,
            "include_simulation": False,
        },
    )
    assert neutral.status_code == 200
    nbody = neutral.json()
    assert nbody["parameter_field"].get("neutral_view") is True
    assert nbody["post"].get("ssr") is False
    assert nbody["post"].get("ssao") is False
    checks.append({"id": "neutral-clamps-post", "ok": True, "detail": "ssr/ssao off under Neutral"})

    report = {
        "schema": "psyfi.simulated_ultra_qa.v1",
        "date": "2026-07-25",
        "mode": "simulated",
        "environment": "ubuntu-ci / TestClient (no physical dGPU)",
        "checks": checks,
        "summary": {
            "total": len(checks),
            "passed": sum(1 for c in checks if c["ok"]),
            "failed": sum(1 for c in checks if not c["ok"]),
        },
        "note": (
            "Simulated stand-in for P0 human Ultra QA on NVIDIA/AMD/Intel desktops. "
            "Adapter→tier classification is covered by gpu:test simulateUltraQa; "
            "this report covers API + /gpu/ mount + G4 ultra snapshots + Neutral clamp."
        ),
    }
    assert report["summary"]["failed"] == 0
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    assert REPORT.exists()
