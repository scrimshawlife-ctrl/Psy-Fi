"""Behavior tests for MIDI FastAPI routes."""

import pytest
from fastapi.testclient import TestClient

from psyfi_api.main import app
from psyfi_api.routers import midi


@pytest.fixture(autouse=True)
def reset_midi_service():
    """Ensure MIDI service state does not leak between tests."""
    midi._midi_service = None
    yield
    midi._midi_service = None


def test_start_rejects_when_midi_unavailable(monkeypatch):
    """Starting the MIDI service should fail fast when dependencies are missing."""
    monkeypatch.setattr(midi, "MIDI_AVAILABLE", False)

    with TestClient(app) as client:
        response = client.post("/api/midi/start", json={})

    assert response.status_code == 503
    assert "MIDI not available" in response.json()["detail"]
    assert midi._midi_service is None


def test_status_and_send_endpoints_require_running_service():
    """Status should report defaults and write operations should 404 without a service."""
    with TestClient(app) as client:
        status_response = client.get("/api/midi/status")
        cc_response = client.post("/api/midi/send/cc", json={"control": 1, "value": 5})
        note_response = client.post(
            "/api/midi/send/note", json={"note": 60, "velocity": 100, "duration": 0.1}
        )

    assert status_response.status_code == 200
    payload = status_response.json()
    assert payload["running"] is False
    assert payload["current_params"] == {}

    assert cc_response.status_code == 404
    assert note_response.status_code == 404


def test_stop_requires_running_service():
    """Stopping without a running service should return a 404 error."""
    with TestClient(app) as client:
        response = client.post("/api/midi/stop")

    assert response.status_code == 404


def test_start_rejects_second_instance(monkeypatch):
    """Starting while a service is active should return a conflict."""

    class DummyService:
        def __init__(self, config=None):
            self.config = config
            self.control_map = midi.MIDIControlMap()
            self.output_port = object()
            self._running = True

        def open(self, *_args, **_kwargs):
            return None

        def start(self):
            self._running = True

        def close(self):
            self._running = False

        def send_cc(self, *_args, **_kwargs):
            return None

        def send_note(self, *_args, **_kwargs):
            return None

        def get_params(self):
            return {"foo": 1.0}

    monkeypatch.setattr(midi, "MIDI_AVAILABLE", True)
    monkeypatch.setattr(midi, "MIDIService", DummyService)

    with TestClient(app) as client:
        first = client.post("/api/midi/start", json={})
        second = client.post("/api/midi/start", json={})

    assert first.status_code == 200
    assert second.status_code == 409


def test_send_commands_require_running_service(monkeypatch):
    """Send endpoints should reject when service exists but is inactive or output-less."""

    class DummyService:
        def __init__(self, running: bool, output_port):
            self._running = running
            self.output_port = output_port
            self.control_map = midi.MIDIControlMap()
            self.config = midi.MIDIConfig()

        def close(self):
            self._running = False

        def get_params(self):
            return {}

        def send_cc(self, *_args, **_kwargs):
            return None

        def send_note(self, *_args, **_kwargs):
            return None

    monkeypatch.setattr(midi, "MIDI_AVAILABLE", True)

    with TestClient(app) as client:
        midi._midi_service = DummyService(running=False, output_port=object())
        inactive_cc = client.post("/api/midi/send/cc", json={"control": 1, "value": 5})
        inactive_note = client.post(
            "/api/midi/send/note", json={"note": 60, "velocity": 100, "duration": 0.1}
        )

        midi._midi_service = DummyService(running=True, output_port=None)
        no_output_cc = client.post("/api/midi/send/cc", json={"control": 1, "value": 5})
        no_output_note = client.post(
            "/api/midi/send/note", json={"note": 60, "velocity": 100, "duration": 0.1}
        )

    assert inactive_cc.status_code == 503
    assert inactive_note.status_code == 503
    assert no_output_cc.status_code == 503
    assert no_output_note.status_code == 503
