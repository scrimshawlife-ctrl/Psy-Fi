# PsyFi — Explicit Function Exports (Canonical)

EXPORTS = [
  {
    "id": "psyfi.op.generate_visual.v1",
    "name": "Generate Visual",
    "kind": "overlay_op",
    "version": "1.0.0",
    "owner": "psyfi",
    "rune": "ᛈᛋᛁ",
    "entrypoint": "psyfi.logic:generate_visual",
    "inputs_schema": {
      "type": "object",
      "properties": {
        "intent": {"type": "string"},
        "palette": {"type": "string"},
        "intensity": {"type": "number"}
      },
      "required": ["intent"],
      "additionalProperties": true
    },
    "outputs_schema": {
      "type": "object",
      "properties": {
        "image_path": {"type": "string"},
        "metadata": {"type": "object"}
      },
      "required": ["image_path"]
    },
    "capabilities": ["cpu", "disk_write"],
    "cost_hint": {
      "ms_p50": 180,
      "ms_p95": 700
    },
    "provenance": {
      "repo": "psyfi",
      "commit": "PINNED",
      "artifact_hash": "PINNED",
      "generated_at": 0
    }
  }
]
