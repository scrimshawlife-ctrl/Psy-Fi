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

## Optional GPU shell in the image

The GPU client is not baked into the default `Dockerfile`. Build and serve it separately if needed:

```bash
npm ci
npm run gpu:build
# Mount packages/psyfi-gpu-renderer/dist or extend the image to copy it;
# FastAPI serves /gpu/ when that dist exists.
```

## Health

```bash
curl -s http://localhost:8000/health
curl -s http://localhost:8000/ready
```

## Related

- `Dockerfile`, `docker-compose.yml`, `nginx.conf`
- `QUICK_DEPLOY.md` — short command reference
- `MOBILE_PWA_GUIDE.md` — PWA notes after the API is reachable
