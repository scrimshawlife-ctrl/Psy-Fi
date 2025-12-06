"""Admin Panel API Routes for PsyFi.

Applied Alchemy Labs - ABX-Core v1.3
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/admin/api", tags=["admin"])

# In-memory storage for run history (in production, use a database)
_run_history: List[Dict[str, Any]] = []
_max_history = 100


class PresetModel(BaseModel):
    """Preset configuration model."""
    name: str
    type: str
    config: Dict[str, Any]


class RunHistoryEntry(BaseModel):
    """Run history entry."""
    timestamp: str
    scenario: str
    seed: int
    width: int
    height: int
    steps: int
    metrics: Dict[str, float]
    duration_ms: float


@router.get("/status")
async def get_system_status():
    """Get system status information."""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "abx_core": "1.3",
        "uptime_seconds": time.time(),  # Simplified
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "engines_available": 20,
        "presets_loaded": 22,
    }


@router.get("/engines")
async def list_engines():
    """List all available consciousness field engines."""
    # Read from engines directory
    engines_dir = Path(__file__).parent.parent.parent / "psyfi_core" / "engines"

    engines = []
    if engines_dir.exists():
        for engine_file in engines_dir.glob("*.py"):
            if engine_file.name != "__init__.py":
                name = engine_file.stem
                engines.append({
                    "name": name,
                    "file": engine_file.name,
                    "enabled": True,
                    "category": _categorize_engine(name),
                })

    return {"engines": engines}


def _categorize_engine(name: str) -> str:
    """Categorize engine by name."""
    if "consciousness" in name or "omega" in name:
        return "core"
    elif "psychedelic" in name or "reset" in name or "receptor" in name:
        return "psychedelic"
    elif "jhana" in name or "attention" in name or "topology" in name:
        return "meditative"
    elif "valence" in name or "pain" in name or "gestalt" in name:
        return "analysis"
    else:
        return "other"


@router.get("/presets")
async def list_presets():
    """List all substance presets."""
    presets_file = Path(__file__).parent.parent.parent / "psyfi_core" / "presets" / "substance_presets.json"

    if not presets_file.exists():
        return {"presets": []}

    with open(presets_file, 'r') as f:
        data = json.load(f)

    # Extract preset names and basic info
    presets = []
    for preset_name, preset_data in data.get("presets", {}).items():
        presets.append({
            "id": preset_name,
            "name": preset_data.get("name", preset_name),
            "class": preset_data.get("class", "unknown"),
            "aliases": preset_data.get("aliases", []),
        })

    return {"presets": presets}


@router.post("/presets")
async def create_preset(preset: PresetModel):
    """Create a new preset."""
    # In production, this would save to file or database
    raise HTTPException(status_code=501, detail="Preset creation not yet implemented")


@router.get("/history")
async def get_run_history(limit: int = 50):
    """Get simulation run history."""
    return {
        "runs": _run_history[-limit:],
        "total": len(_run_history),
    }


@router.post("/history")
async def add_run_history(entry: RunHistoryEntry):
    """Add entry to run history."""
    global _run_history

    _run_history.append(entry.model_dump())

    # Keep only last N entries
    if len(_run_history) > _max_history:
        _run_history = _run_history[-_max_history:]

    return {"status": "ok"}


@router.delete("/history")
async def clear_run_history():
    """Clear all run history."""
    global _run_history
    _run_history = []
    return {"status": "cleared"}


@router.get("/config")
async def get_config():
    """Get current configuration."""
    return {
        "environment": "production",
        "safety_clamp": True,
        "max_field_size": 512,
        "max_steps": 1000,
        "default_seed": 42,
    }


@router.get("/logs")
async def get_logs(limit: int = 100):
    """Get recent log entries."""
    # In production, read from log files
    return {
        "logs": [
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": "INFO",
                "message": "System operational",
            }
        ]
    }
