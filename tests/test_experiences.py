"""Tests for experience catalog and deterministic parameter mapping."""

from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_core.experiences.catalog import load_catalog
from psyfi_core.experiences.parameter_mapper import (
    build_parameter_timeline,
    map_parameters,
)


def test_catalog_has_minimum_recipes():
    catalog = load_catalog()
    assert len(catalog.recipes) >= 12
    substances = set(catalog.substances())
    for required in ("lsd", "psilocybin", "dmt"):
        assert required in substances


def test_parameter_mapper_determinism():
    a = map_parameters(substance="lsd", mode="attractor", intensity=0.8, seed=123, phase_t=0.4)
    b = map_parameters(substance="lsd", mode="attractor", intensity=0.8, seed=123, phase_t=0.4)
    assert a.hash == b.hash
    assert a.parameters == b.parameters


def test_timeline_hash_stable():
    t1 = build_parameter_timeline(steps=12, substance="dmt", mode="power", seed=7, intensity=0.9)
    t2 = build_parameter_timeline(steps=12, substance="dmt", mode="power", seed=7, intensity=0.9)
    assert t1["timeline_hash"] == t2["timeline_hash"]
    assert len(t1["frames"]) == 12


def test_neutral_view_dominates_engines():
    snap = map_parameters(substance="dmt", mode="power", intensity=1.0, seed=1, neutral_view=True)
    assert snap.engines.get("neutral_view", 0) >= 0.99
    assert snap.parameters.get("flash_energy", 1) == 0.0


def test_reduce_motion_lowers_zoom():
    normal = map_parameters(substance="lsd", mode="open", intensity=0.9, seed=2, phase_t=0.5)
    reduced = map_parameters(
        substance="lsd", mode="open", intensity=0.9, seed=2, phase_t=0.5, reduce_motion=True
    )
    assert reduced.parameters["recursive_zoom"] <= normal.parameters["recursive_zoom"]
    assert reduced.safety["max_flash_hz"] <= normal.safety["max_flash_hz"]


def test_modes_differ():
    open_p = map_parameters(substance="lsd", mode="open", seed=3, intensity=0.8, phase_t=0.5)
    attr = map_parameters(substance="lsd", mode="attractor", seed=3, intensity=0.8, phase_t=0.5)
    void = map_parameters(substance="lsd", mode="void", seed=3, intensity=0.8, phase_t=0.5)
    assert open_p.hash != attr.hash
    assert attr.parameters["attractor_bias"] > open_p.parameters["attractor_bias"]
    assert void.parameters["void_bias"] > open_p.parameters["void_bias"]


def test_api_list_experiences():
    with TestClient(app) as client:
        res = client.get("/api/v1/experiences")
    assert res.status_code == 200
    payload = res.json()
    assert payload["count"] >= 12
    assert payload["items"]


def test_api_timeline():
    with TestClient(app) as client:
        catalog = client.get("/api/v1/experiences").json()
        exp_id = catalog["items"][0]["id"]
        res = client.post(
            "/api/v1/visualize/parameter-timeline",
            json={
                "experience_id": exp_id,
                "mode": "attractor",
                "intensity": 0.75,
                "seed": 99,
                "steps": 8,
            },
        )
    assert res.status_code == 200
    body = res.json()
    assert body["kind"] == "timeline"
    assert body["timeline_hash"]
    assert len(body["frames"]) == 8


def test_api_substances():
    with TestClient(app) as client:
        res = client.get("/api/v1/substances")
    assert res.status_code == 200
    payload = res.json()
    by_id = {s["id"]: s for s in payload["substances"]}
    assert "lsd" in by_id
    assert "open" in payload["modes"]
    lsd = by_id["lsd"]
    assert lsd["overlay"]
    assert "visual_signature" in lsd["overlay"]
    assert "engine_weights" in lsd["overlay"]
    assert lsd["visual_signature"]["oscillation_style"]
    assert lsd["recommended_mode"] in {"open", "attractor", "void", "power"}


def test_substance_overlays_drive_distinct_engines():
    lsd = map_parameters(substance="lsd", mode="open", seed=11, intensity=0.8, phase_t=0.5)
    psilo = map_parameters(substance="psilocybin", mode="open", seed=11, intensity=0.8, phase_t=0.5)
    dmt = map_parameters(substance="dmt", mode="open", seed=11, intensity=0.8, phase_t=0.5)
    mdma = map_parameters(substance="mdma", mode="open", seed=11, intensity=0.8, phase_t=0.5)
    ketamine = map_parameters(substance="ketamine", mode="open", seed=11, intensity=0.8, phase_t=0.5)
    assert lsd.hash != psilo.hash != dmt.hash
    assert mdma.hash != lsd.hash
    assert ketamine.hash != lsd.hash
    assert lsd.engines.get("kaleidoscope", 0) >= psilo.engines.get("kaleidoscope", 0) * 0.6
    assert psilo.engines.get("organic_bloom", 0) >= lsd.engines.get("organic_bloom", 0)
    assert dmt.engines.get("entity_lattice", 0) >= lsd.engines.get("entity_lattice", 0)
    assert mdma.engines.get("organic_bloom", 0) >= lsd.engines.get("organic_bloom", 0)
    assert mdma.palette["tracers"] != lsd.palette["tracers"]
    assert ketamine.engines.get("flow_field", 0) >= lsd.engines.get("flow_field", 0) * 0.9


def test_catalog_covers_secondary_substances():
    catalog = load_catalog()
    for substance in ("mdma", "2c-b", "eth-lad", "jhana", "dxm"):
        recipes = catalog.list(substance=substance, valence=None)
        assert recipes, substance
        overlay = catalog.overlay(substance)
        assert overlay, substance
        assert overlay.get("tracers_color")
        assert overlay["tracers_color"] != "#63F3E8" or substance == "baseline"
