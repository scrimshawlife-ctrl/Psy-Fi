"""PsyFi API - Main FastAPI application."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from psyfi_api.routers import simulate, midi, presets, jobs, telemetry
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

# Include routers
app.include_router(simulate.router)
app.include_router(midi.router)
app.include_router(presets.router)
app.include_router(jobs.router)
app.include_router(telemetry.router)


@app.get("/")
async def root(request: Request):
    """Root endpoint - serves the web UI.

    Args:
        request: FastAPI request object

    Returns:
        HTML template response with request context
    """
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
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }


@app.get("/ready")
async def ready() -> dict:
    """Readiness check: presets and critical static assets must be available."""
    from datetime import datetime, timezone

    checks: dict[str, bool] = {}
    try:
        presets = get_registry().list_presets()
        checks["presets_loaded"] = len(presets) > 0
    except Exception:  # noqa: BLE001
        checks["presets_loaded"] = False

    checks["session_schema"] = (REPO_ROOT / "psyfi_core" / "schemas" / "session.schema.json").exists()
    checks["icon_192"] = (BASE_DIR / "static" / "icon-192.png").exists()
    checks["icon_512"] = (BASE_DIR / "static" / "icon-512.png").exists()
    checks["renderer_js"] = (BASE_DIR / "static" / "renderer.js").exists()

    ready_ok = all(checks.values())
    return {
        "status": "ready" if ready_ok else "not_ready",
        "service": "psyfi-api",
        "version": app.version,
        "checks": checks,
        "telemetry_server_enabled": TELEMETRY_ENABLED,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/api/info")
async def api_info() -> dict[str, str | bool]:
    """API info endpoint (for programmatic access)."""
    return {
        "message": "PsyFi API - Consciousness Field Simulation",
        "version": "0.1.0",
        "abx_core": "1.3",
        "telemetry_server_enabled": TELEMETRY_ENABLED,
    }
