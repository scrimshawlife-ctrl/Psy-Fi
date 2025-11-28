# PsyFi Deployment Guide
**Applied Alchemy Labs | Production Deployment Options**

This guide covers multiple deployment strategies for the PsyFi consciousness field engine.

---

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
  - [Railway](#railway)
  - [Render](#render)
  - [Heroku](#heroku)
  - [Fly.io](#flyio)
  - [DigitalOcean App Platform](#digitalocean-app-platform)
- [VPS Deployment](#vps-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring & Observability](#monitoring--observability)

---

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/Psy-Fi.git
cd Psy-Fi

# Install dependencies
pip install -e .

# Run development server
cd psyfi_api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Visit http://localhost:8000
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

---

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t psyfi:latest .

# Run container
docker run -d \
  --name psyfi \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  psyfi:latest

# Check logs
docker logs -f psyfi

# Stop container
docker stop psyfi
```

### Docker Compose (Recommended)

```bash
# Development mode
docker-compose up

# Production mode with nginx
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Commands

```bash
# Rebuild after code changes
docker-compose build

# Start in detached mode
docker-compose up -d

# Scale workers (if using multiple containers)
docker-compose up --scale psyfi=4

# View resource usage
docker-compose stats

# Clean up
docker-compose down -v
```

---

## Cloud Platforms

### Railway

**One-Click Deploy:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

**Manual Deployment:**

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Set environment variables:
```bash
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=info
railway variables set WORKERS=4
```

4. Access logs:
```bash
railway logs
```

**Configuration:** Uses `railway.json`

**Features:**
- ✅ Auto-scaling
- ✅ Free tier available
- ✅ PostgreSQL addon support
- ✅ Custom domains
- ✅ Zero-downtime deployments

---

### Render

**One-Click Deploy:**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Manual Deployment:**

1. Create account at [render.com](https://render.com)

2. Create new Web Service:
   - **Build Command:** `pip install -e .`
   - **Start Command:** `uvicorn psyfi_api.main:app --host 0.0.0.0 --port $PORT --workers 4`
   - **Health Check Path:** `/health`

3. Set environment variables:
   - `ENVIRONMENT=production`
   - `LOG_LEVEL=info`
   - `WORKERS=4`

4. Deploy from GitHub (auto-deploy on push)

**Configuration:** Uses `render.yaml`

**Features:**
- ✅ Auto SSL certificates
- ✅ Auto-deploy from Git
- ✅ Free tier available
- ✅ PostgreSQL addon
- ✅ DDoS protection

---

### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create psyfi-app

# Set buildpack
heroku buildpacks:set heroku/python

# Configure environment
heroku config:set ENVIRONMENT=production
heroku config:set LOG_LEVEL=info
heroku config:set WORKERS=4

# Deploy
git push heroku main

# Open app
heroku open

# View logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=2
```

**Procfile:**
```
web: uvicorn psyfi_api.main:app --host 0.0.0.0 --port $PORT --workers 4
```

**Features:**
- ✅ Easy scaling
- ✅ Add-on marketplace
- ✅ Metrics & monitoring
- ✅ Review apps
- ❌ No free tier (2022+)

---

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy

# Open app
fly open

# View logs
fly logs

# Scale
fly scale count 2
fly scale vm shared-cpu-1x
```

**fly.toml:**
```toml
app = "psyfi"

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/python"]

[env]
  PORT = "8000"
  ENVIRONMENT = "production"

[[services]]
  http_checks = []
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
```

**Features:**
- ✅ Global edge deployment
- ✅ Free allowance
- ✅ Fast deployments
- ✅ WebSocket support
- ✅ Volume storage

---

### DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)

2. Go to App Platform → Create App

3. Connect GitHub repository

4. Configure app:
   - **Build Command:** `pip install -e .`
   - **Run Command:** `uvicorn psyfi_api.main:app --host 0.0.0.0 --port 8080 --workers 4`
   - **HTTP Port:** 8080

5. Set environment variables in dashboard

6. Deploy

**Features:**
- ✅ Auto-scaling
- ✅ Managed databases
- ✅ Load balancing
- ✅ CDN included
- ✅ $5/month starter tier

---

## VPS Deployment

### DigitalOcean Droplet / AWS EC2 / Linode

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Update system
apt update && apt upgrade -y

# 3. Install dependencies
apt install -y python3.11 python3-pip nginx git

# 4. Clone repository
cd /opt
git clone https://github.com/your-org/Psy-Fi.git
cd Psy-Fi

# 5. Install Python packages
pip3 install -e .

# 6. Create systemd service
cat > /etc/systemd/system/psyfi.service <<EOF
[Unit]
Description=PsyFi API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/Psy-Fi
Environment="PATH=/usr/local/bin"
ExecStart=/usr/local/bin/uvicorn psyfi_api.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 7. Start service
systemctl daemon-reload
systemctl enable psyfi
systemctl start psyfi

# 8. Configure Nginx
cp nginx.conf /etc/nginx/sites-available/psyfi
ln -s /etc/nginx/sites-available/psyfi /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 9. Setup SSL with Let's Encrypt
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com

# 10. Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

**Service Management:**
```bash
# Check status
systemctl status psyfi

# View logs
journalctl -u psyfi -f

# Restart service
systemctl restart psyfi

# Update application
cd /opt/Psy-Fi
git pull
pip3 install -e .
systemctl restart psyfi
```

---

## Production Checklist

### Security

- [ ] Set strong `SECRET_KEY` in environment
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly (`ALLOWED_ORIGINS`)
- [ ] Set up firewall rules
- [ ] Enable rate limiting if needed
- [ ] Review API key requirements
- [ ] Set secure HTTP headers (nginx config included)
- [ ] Disable debug mode (`DEBUG=false`)

### Performance

- [ ] Set appropriate worker count (CPU cores × 2)
- [ ] Enable gzip compression (nginx config included)
- [ ] Configure caching headers
- [ ] Set up CDN for static assets
- [ ] Monitor memory usage
- [ ] Enable connection pooling if using DB

### Reliability

- [ ] Configure health checks
- [ ] Set up monitoring/alerting
- [ ] Enable auto-restart on failure
- [ ] Configure log rotation
- [ ] Set up backups (if using persistent storage)
- [ ] Test disaster recovery

### Monitoring

- [ ] Set up application logging
- [ ] Configure error tracking (Sentry)
- [ ] Monitor uptime
- [ ] Track API performance
- [ ] Set up alerts for errors

---

## Monitoring & Observability

### Health Endpoint

The `/health` endpoint provides application status:

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-28T12:00:00Z"
}
```

### Logging

**View application logs:**

```bash
# Docker
docker logs -f psyfi

# Docker Compose
docker-compose logs -f psyfi

# Systemd
journalctl -u psyfi -f

# Railway
railway logs

# Heroku
heroku logs --tail
```

### Sentry Integration (Optional)

```bash
# Install Sentry SDK
pip install sentry-sdk[fastapi]

# Set environment variable
export SENTRY_DSN=your-sentry-dsn

# Sentry will auto-capture errors
```

### Metrics (Optional)

Add Prometheus metrics:

```bash
pip install prometheus-fastapi-instrumentator
```

See `/metrics` endpoint for Prometheus-compatible metrics.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Environment (development/production) |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warning/error) |
| `DEBUG` | `false` | Enable debug mode |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `WORKERS` | `4` | Number of worker processes |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |
| `DEFAULT_SEED` | `1337` | Default ABX-Core seed |
| `ENABLE_SAFETY_CLAMP` | `true` | Enable parameter safety limits |
| `SECRET_KEY` | - | Secret key for sessions (set in production) |

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Module Import Errors

```bash
# Reinstall in editable mode
pip install -e .

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
```

### Docker Build Fails

```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t psyfi:latest .
```

### Permission Errors

```bash
# Fix ownership (Docker)
chown -R 1000:1000 /app

# Fix permissions (VPS)
chown -R www-data:www-data /opt/Psy-Fi
```

---

## Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/your-org/Psy-Fi/issues)
- **API Docs:** http://localhost:8000/docs

---

**Applied Alchemy Labs | PsyFi v1.0**
**ABX-Core v1.3 | Consciousness Field Engine**
