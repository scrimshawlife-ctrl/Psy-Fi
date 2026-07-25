# PsyFi Deployment Guide

**Supported model: Docker** (single container or Compose). Azure App Service and Render one-click paths have been removed.

## Local development

```bash
git clone https://github.com/scrimshawlife-ctrl/Psy-Fi.git
cd Psy-Fi
pip install -e ".[dev]"
cp .env.example .env
python3 scripts/run_dev_server.py
# → http://localhost:8000
```

## Docker (recommended)

### Single container

```bash
docker build -t psyfi:latest .
docker run -d --name psyfi -p 8000:8000 -e ENVIRONMENT=production psyfi:latest
docker logs -f psyfi
curl -s http://localhost:8000/health
```

### Docker Compose

```bash
# API only
docker compose up -d --build

# API + nginx reverse proxy
docker compose --profile production up -d --build
```

Helper script (local / Docker / Compose / production checks):

```bash
./scripts/deploy.sh
```

## Production checklist

1. Copy `.env.example` → `.env` and set non-default secrets.
2. `python3 -m pytest tests/ -q`
3. `docker build -t psyfi:latest .`
4. Run behind TLS (Compose `production` profile with `nginx.conf`, or your own reverse proxy).
5. Confirm `/health` and `/ready`.

## GPU shell in the image

The multi-stage `Dockerfile` runs `npm run gpu:build` and copies `packages/psyfi-gpu-renderer/dist` into the image. FastAPI serves it at `/gpu/` when present.

Local iteration without rebuilding the image:

```bash
npm ci
npm run gpu:build
python3 scripts/run_dev_server.py
# → http://localhost:8000/gpu/
```

### NVIDIA desktop (RTX 5060 / 40-series / etc.)

`/gpu/` uses **browser WebGPU** on your discrete NVIDIA GPU (not CUDA in Python).

```bash
# Host driver check
./scripts/check_nvidia_host.sh

# Optional: Compose with NVIDIA Container Toolkit GPU reservation
docker compose --profile nvidia up -d --build

# Then open Chrome/Edge → http://localhost:8000/gpu/
# Force High-performance NVIDIA GPU for the browser if hybrid graphics.
```

Full guide: [`docs/NVIDIA_GPU.md`](docs/NVIDIA_GPU.md).

See [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) for the ship board.

## Health

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/ready
```

## Related

- `Dockerfile`, `docker-compose.yml`, `nginx.conf`
- `QUICK_DEPLOY.md` — short command reference
- `MOBILE_PWA_GUIDE.md` — PWA notes after the API is reachable
