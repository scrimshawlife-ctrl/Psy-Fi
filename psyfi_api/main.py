"""PsyFi API - Main FastAPI application."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from psyfi_api.routers import simulate, midi, admin

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
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Include routers
app.include_router(simulate.router)
app.include_router(midi.router)
app.include_router(admin.router)


@app.get("/")
async def root(request: Request):
    """Root endpoint - serves the web UI.

    Args:
        request: FastAPI request object

    Returns:
        HTML template response
    """
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/admin")
async def admin_panel(request: Request):
    """Admin panel endpoint - serves the admin UI.

    Args:
        request: FastAPI request object

    Returns:
        HTML template response
    """
    return templates.TemplateResponse("admin.html", {"request": request})


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint for monitoring and load balancers.

    Returns:
        Comprehensive health status with version and timestamp
    """
    from datetime import datetime
    return {
        "status": "healthy",
        "service": "psyfi-api",
        "version": "1.0.0",
        "abx_core": "1.3",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/info")
async def api_info() -> dict[str, str]:
    """API info endpoint (for programmatic access).

    Returns:
        API information
    """
    return {
        "message": "PsyFi API - Consciousness Field Simulation",
        "version": "0.1.0",
        "abx_core": "1.3",
    }
