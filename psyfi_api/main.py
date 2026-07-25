"""PsyFi API - Main FastAPI application."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from psyfi_api.routers import experiences, jobs, midi, presets, simulate, telemetry
from psyfi_api.telemetry import TELEMETRY_ENABLED
from psyfi_core.models.substance_preset import get_registry

# Initialize FastAPI app
app = FastAPI(
    title="PsyFi API",
    description="Consciousness field simulation engine with ABX-Core v1.3",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup static files and templates
BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
# Reuse the existing docs/icons pack for PWA/browser icons.
app.mount(
    "/assets/icons",
    StaticFiles(directory=str(REPO_ROOT / "docs" / "icons")),
    name="icons",
)
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Legacy compatibility mounts
app.include_router(simulate.router)  # /simulate/
app.include_router(midi.router, prefix="/api")  # /api/midi
app.include_router(presets.router, prefix="/api")  # /api/presets
app.include_router(jobs.router, prefix="/api")  # /api/jobs
app.include_router(telemetry.router, prefix="/api")  # /api/telemetry

# Versioned public web API (canonical for the browser client)
app.include_router(simulate.router, prefix="/api/v1")  # /api/v1/simulate/
app.include_router(midi.router, prefix="/api/v1")  # /api/v1/midi
app.include_router(presets.router, prefix="/api/v1")  # /api/v1/presets
app.include_router(jobs.router, prefix="/api/v1")  # /api/v1/jobs
app.include_router(telemetry.router, prefix="/api/v1")  # /api/v1/telemetry
# Experiences router already uses /api/v1 prefix internally
app.include_router(experiences.router)


@app.get("/")
async def root(request: Request):
    """Root endpoint - serves the web UI."""
    return templates.TemplateResponse(request, "index.html")


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness check for monitoring and load balancers."""
    from datetime import datetime, timezone

    return {
        "status": "healthy",
        "service": "psyfi-api",
        "version": app.version,
        "abx_core": "1.3",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/ready")
@app.get("/api/v1/ready")
async def ready() -> dict:
    """Readiness check: presets and critical static assets must be available."""
    from datetime import datetime, timezone

    checks: dict[str, bool] = {}
    try:
        preset_names = get_registry().list_presets()
        checks["presets_loaded"] = len(preset_names) > 0
    except Exception:  # noqa: BLE001
        checks["presets_loaded"] = False

    checks["session_schema"] = (
        REPO_ROOT / "psyfi_core" / "schemas" / "session.schema.json"
    ).exists()
    checks["icon_192"] = (BASE_DIR / "static" / "icon-192.png").exists()
    checks["icon_512"] = (BASE_DIR / "static" / "icon-512.png").exists()
    checks["renderer_js"] = (BASE_DIR / "static" / "renderer.js").exists()
    checks["experience_player"] = (BASE_DIR / "static" / "viz" / "experiencePlayer.js").exists()
    checks["experience_catalog"] = (
        REPO_ROOT / "data" / "phenomenology" / "derived" / "experience_catalog.v1.json"
    ).exists()
    checks["visual_overlays"] = (
        REPO_ROOT / "data" / "phenomenology" / "derived" / "substance_visual_overlays.v1.json"
    ).exists()

    ready_ok = all(checks.values())
    return {
        "status": "ready" if ready_ok else "not_ready",
        "service": "psyfi-api",
        "version": app.version,
        "api_version": "v1",
        "checks": checks,
        "telemetry_server_enabled": TELEMETRY_ENABLED,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/api/info")
@app.get("/api/v1/info")
async def api_info() -> dict[str, str | bool]:
    """API info endpoint (legacy + v1)."""
    return {
        "message": "PsyFi API - Consciousness Field Simulation",
        "version": "0.1.0",
        "api_version": "v1",
        "abx_core": "1.3",
        "telemetry_server_enabled": TELEMETRY_ENABLED,
    }
