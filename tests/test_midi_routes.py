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


def test_output_only_start_keeps_service_active(monkeypatch):
    """Output-only MIDI start must mark the service active for send routes."""

    class OutputOnlyService:
        def __init__(self, config=None):
            self.config = config or midi.MIDIConfig()
            self.control_map = midi.MIDIControlMap()
            self.input_port = None
            self.output_port = None
            self._running = False
            self.sent = []

        def open(self, input_device=None, output_device=None):
            # Simulate an environment with an output device only.
            self.output_port = object()
            self.config.output_device = output_device or "Virtual Output"

        def start(self):
            # Mirror the real service contract: active without an input thread.
            if not self.input_port and not self.output_port:
                raise RuntimeError("No MIDI ports open")
            self._running = True

        def close(self):
            self._running = False
            self.output_port = None

        def get_params(self):
            return {}

        def send_cc(self, control, value):
            self.sent.append(("cc", control, value))

        def send_note(self, note, velocity, duration=0.1):
            self.sent.append(("note", note, velocity, duration))

    monkeypatch.setattr(midi, "MIDI_AVAILABLE", True)
    monkeypatch.setattr(midi, "MIDIService", OutputOnlyService)

    with TestClient(app) as client:
        start = client.post(
            "/api/midi/start",
            json={"output_device": "Virtual Output"},
        )
        status = client.get("/api/midi/status")
        mappings = client.get("/api/midi/mappings")
        cc = client.post("/api/midi/send/cc", json={"control": 1, "value": 64})

    assert start.status_code == 200
    assert status.status_code == 200
    assert status.json()["running"] is True
    assert mappings.status_code == 200
    assert mappings.json()["note_to_preset"]["64"] == "5-meo-dmt"
    assert cc.status_code == 200
    assert midi._midi_service.sent == [("cc", 1, 64)]


def test_midi_service_start_output_only_sets_running():
    """Unit-level: MIDIService.start() activates output-only sessions."""
    from psyfi_core.midi.service import MIDIService

    service = MIDIService.__new__(MIDIService)
    service.input_port = None
    service.output_port = object()
    service._running = False
    service._input_thread = None

    MIDIService.start(service)

    assert service._running is True
    assert service._input_thread is None


def test_midi_service_start_requires_a_port():
    """Unit-level: start without any open ports should fail fast."""
    from psyfi_core.midi.service import MIDIService

    service = MIDIService.__new__(MIDIService)
    service.input_port = None
    service.output_port = None
    service._running = False
    service._input_thread = None

    with pytest.raises(RuntimeError, match="No MIDI ports open"):
        MIDIService.start(service)
