# Quick Deployment Reference

Docker is the supported deploy path.

## Local

```bash
pip install -e ".[dev]" && python3 scripts/run_dev_server.py
```

## Docker

```bash
docker build -t psyfi . && docker run -p 8000:8000 psyfi
```

## Docker Compose

```bash
docker compose up -d --build
```

## NVIDIA desktop (RTX 5060, etc.)

```bash
./scripts/check_nvidia_host.sh
docker compose --profile nvidia up -d --build
# Chrome/Edge → http://localhost:8000/gpu/  (High-performance GPU)
```

Details: [`docs/NVIDIA_GPU.md`](docs/NVIDIA_GPU.md).

## Helper

```bash
./scripts/deploy.sh
```

## Health

```bash
curl -s http://localhost:8000/health
```

Full guide: [`DEPLOYMENT.md`](DEPLOYMENT.md).
