# Quick Deployment Reference
**Applied Alchemy Labs | PsyFi v1.0**

Fast deployment commands for common platforms.

---

## 🚀 One-Line Deployments

### Local Development
```bash
pip install -e . && cd psyfi_api && uvicorn main:app --reload
```

### Docker
```bash
docker build -t psyfi . && docker run -p 8000:8000 psyfi
```

### Docker Compose
```bash
docker-compose up -d
```

### Deployment Helper Script
```bash
./scripts/deploy.sh
```

---

## ☁️ Cloud Platforms

### Railway
```bash
railway up
```

### Render
Push to GitHub → Auto-deploy

### Heroku
```bash
git push heroku main
```

### Fly.io
```bash
fly deploy
```

---

## 🔗 Quick Links

| Platform | URL | Free Tier |
|----------|-----|-----------|
| [Railway](https://railway.app) | Deploy with GitHub | ✅ $5 credit |
| [Render](https://render.com) | Auto-deploy on push | ✅ 750hrs/month |
| [Fly.io](https://fly.io) | Global edge | ✅ 3 VMs free |
| [Heroku](https://heroku.com) | Classic PaaS | ❌ Paid only |

---

## 📋 Pre-Deployment Checklist

```bash
# 1. Environment setup
cp .env.example .env
nano .env  # Set SECRET_KEY and other vars

# 2. Test locally
pip install -e .
python -m pytest

# 3. Build Docker (optional)
docker build -t psyfi .

# 4. Deploy!
```

---

## 🏥 Health Check

After deployment, verify health:

```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "psyfi-api",
  "version": "1.0.0",
  "abx_core": "1.3",
  "timestamp": "2025-11-28T12:00:00Z"
}
```

---

## 📚 Full Documentation

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guide.

---

**Applied Alchemy Labs | ABX-Core v1.3**
