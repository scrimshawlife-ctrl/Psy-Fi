# PsyFi Overlay API

The PsyFi Overlay Server provides a capability-based API with full provenance tracking for all operations.

## Architecture

The overlay server implements:
- **Capability-based routing**: All operations are invoked via named capabilities
- **Provenance tracking**: Every request generates a unique run ID and tracks environment fingerprints
- **Deterministic execution**: When a seed is provided, results are reproducible

## Running the Server

```bash
# Default (localhost:8787)
python scripts/run_overlay_server.py

# Custom host/port
python scripts/run_overlay_server.py --host 0.0.0.0 --port 8787
```

## API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "service": "psyfi_overlay"
}
```

### `POST /run`

Execute a capability with provenance tracking.

**Request Format:**
```json
{
  "capability": "psyfi.simulate",
  "input": {
    "width": 64,
    "height": 64,
    "steps": 20,
    "seed": 42
  },
  "seed": "optional-deterministic-seed"
}
```

**Response Format:**
```json
{
  "ok": true,
  "result": { /* capability-specific result */ },
  "error": null,
  "provenance": {
    "run_id": "sha256-hash-of-request",
    "ts_utc": "2025-12-14T12:00:00+00:00",
    "payload_hash": "sha256-hash-of-input",
    "env": {
      "python": "3.11.0",
      "platform": "Linux-4.4.0",
      "git_head": "abc123...",
      "cwd": "/path/to/Psy-Fi"
    }
  }
}
```

## Available Capabilities

### `psyfi.ping`

Health check capability.

**Input:** `{}`

**Output:**
```json
{
  "pong": true,
  "service": "psyfi"
}
```

### `psyfi.echo`

Echo input for testing.

**Input:**
```json
{
  "message": "test"
}
```

**Output:**
```json
{
  "echo": {
    "message": "test"
  }
}
```

### `psyfi.simulate`

Run a consciousness field simulation.

**Input:**
```json
{
  "width": 64,
  "height": 64,
  "steps": 20,
  "scenario": "lsd",
  "seed": 42
}
```

**Output:**
```json
{
  "width": 64,
  "height": 64,
  "steps": 20,
  "scenario": "lsd",
  "seed": 42,
  "valence": 0.234,
  "coherence": 0.456,
  "symmetry": 0.789,
  "roughness": 0.123,
  "richness": 0.567,
  "magnitude": [[...], [...]]
}
```

### `psyfi.list_presets`

List available substance presets.

**Input:** `{}`

**Output:**
```json
{
  "presets": [
    {
      "id": "lsd",
      "name": "LSD",
      "class": "classic_psychedelic",
      "aliases": ["lysergic acid diethylamide", "acid", "L"]
    },
    ...
  ],
  "count": 22
}
```

### `psyfi.list_engines`

List available consciousness field engines.

**Input:** `{}`

**Output:**
```json
{
  "engines": [
    {
      "id": "consciousness_omega",
      "name": "Consciousness Omega"
    },
    ...
  ],
  "count": 20
}
```

## Example Usage

### Python Client

```python
import requests

# Run a simulation
response = requests.post("http://localhost:8787/run", json={
    "capability": "psyfi.simulate",
    "input": {
        "width": 64,
        "height": 64,
        "steps": 20,
        "scenario": "lsd",
        "seed": 42
    },
    "seed": "my-deterministic-seed"
})

result = response.json()
print(f"Run ID: {result['provenance']['run_id']}")
print(f"Valence: {result['result']['valence']:.3f}")
```

### cURL

```bash
# Ping
curl -X POST http://localhost:8787/run \
  -H "Content-Type: application/json" \
  -d '{"capability": "psyfi.ping", "input": {}}'

# Simulate
curl -X POST http://localhost:8787/run \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "psyfi.simulate",
    "input": {
      "width": 64,
      "height": 64,
      "steps": 20,
      "seed": 42
    }
  }'

# List presets
curl -X POST http://localhost:8787/run \
  -H "Content-Type: application/json" \
  -d '{"capability": "psyfi.list_presets", "input": {}}'
```

## Provenance

Every request generates a unique `run_id` that is:
- **Deterministic**: If you provide the same seed and input, you get the same run_id
- **Content-addressable**: The run_id is a SHA-256 hash of the capability, input, and seed
- **Traceable**: Includes environment fingerprint (Python version, platform, git commit, cwd)

This ensures:
- **Reproducibility**: Results can be verified by re-running with the same seed
- **Auditability**: Full chain of custody for all operations
- **Debuggability**: Environment information helps track down platform-specific issues

## Integration with FastAPI

The overlay server runs independently from the main FastAPI application. This allows:
- Different deployment models (separate services vs. unified)
- Clean separation of concerns (capability-based vs. REST)
- Provenance tracking without modifying existing API

To run both servers:
```bash
# Terminal 1: FastAPI (port 8000)
python scripts/run_dev_server.py

# Terminal 2: Overlay (port 8787)
python scripts/run_overlay_server.py
```

## Future Capabilities

Planned capabilities to add:
- `psyfi.batch_simulate`: Run multiple simulations in parallel
- `psyfi.analyze_field`: Detailed field analysis and visualization
- `psyfi.compare_scenarios`: Compare multiple substance scenarios
- `psyfi.export_field`: Export field data to various formats (HDF5, NPY, etc.)
- `psyfi.midi_control`: MIDI-based real-time field control
