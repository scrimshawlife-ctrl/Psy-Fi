# Render Deployment Guide for PsyFi

Quick guide for deploying PsyFi to Render.com

## Prerequisites

- GitHub account connected to Render
- PsyFi repository pushed to GitHub

## Deployment Steps

### 1. Connect Repository to Render

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your **Psy-Fi** repository
5. Render will auto-detect `render.yaml`

### 2. Configure Service

Render will automatically configure based on `render.yaml`:

- **Name**: `psyfi-api`
- **Environment**: `Python 3.11`
- **Region**: Oregon (or choose closest to users)
- **Plan**: Starter (free tier available)
- **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command**: `uvicorn psyfi_api.main:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `/health`

### 3. Environment Variables (Pre-configured)

These are already set in `render.yaml`:

```
ENVIRONMENT=production
LOG_LEVEL=info
ENABLE_SAFETY_CLAMP=true
PYTHON_VERSION=3.11.0
```

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start the application
   - Run health checks
3. Wait 2-5 minutes for first deployment

### 5. Verify Deployment

Once deployed, test your service:

```bash
# Replace with your Render URL
curl https://psyfi-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "psyfi-api",
  "version": "1.0.0",
  "abx_core": "1.3",
  "timestamp": "2025-12-01T20:15:30.000Z"
}
```

Test the web UI:
```
https://psyfi-api.onrender.com/
```

Test consciousness simulation:
```bash
curl -X POST https://psyfi-api.onrender.com/simulate/ \
  -H "Content-Type: application/json" \
  -d '{"width": 32, "height": 32, "steps": 10}'
```

## MIDI Support

**Note**: MIDI features are disabled on Render by default due to missing system audio libraries (ALSA/JACK). This is intentional for cloud deployments.

The API will return:
```json
{
  "input": [],
  "output": [],
  "midi_available": false
}
```

For full MIDI support, deploy to a VPS with:
- `requirements-midi.txt` instead of `requirements.txt`
- System packages: `libasound2-dev libjack-dev`

## Common Issues

### Build Fails with "python-rtmidi" Error

**Cause**: `python-rtmidi` requires system audio libraries

**Solution**: Already handled! We've removed MIDI from `requirements.txt`. The app works without MIDI.

### Build Fails with "No module named 'jinja2'"

**Cause**: Missing web dependencies

**Solution**: Already fixed! `jinja2` and `python-multipart` are in `requirements.txt`

### App Crashes on Startup

**Cause**: Usually missing dependency

**Solution**: Check Render logs:
1. Go to your service dashboard
2. Click **"Logs"** tab
3. Look for Python import errors
4. File an issue with logs if not resolved

### Health Check Fails

**Cause**: App not listening on correct port

**Solution**: Already handled! We use `$PORT` environment variable from Render

### Slow Cold Starts

**Cause**: Free tier services sleep after inactivity

**Solutions**:
- Upgrade to paid plan ($7/month) for always-on
- Use external monitoring to ping every 10 minutes (keeps service awake)
- Accept 30-60s cold start for free tier

## Performance Tuning

### Free Tier (512MB RAM)
- **Workers**: 1 (auto-set by uvicorn)
- **Field Size**: Limit to 64×64 max
- **Steps**: Limit to 100 steps max

### Starter Plan ($7/month, 512MB RAM)
- **Workers**: 1-2
- **Field Size**: 128×128 comfortable
- **Steps**: 500 steps comfortable

### Standard Plan ($25/month, 2GB RAM)
- **Workers**: 4
- **Field Size**: 256×256
- **Steps**: 1000+ steps

## Auto-Deploy

Render will automatically redeploy when you push to the main branch:

```bash
git push origin main
```

Watch deployment progress in Render dashboard.

## Monitoring

### Health Check
```bash
curl https://your-app.onrender.com/health
```

### API Documentation
```
https://your-app.onrender.com/docs
```

### Logs
- Access via Render dashboard
- Or use Render CLI: `render logs -s psyfi-api`

## Custom Domain

1. Go to service **Settings** → **Custom Domain**
2. Add your domain (e.g., `psyfi.yourdomain.com`)
3. Update DNS with provided records
4. Render provides free SSL certificate

## Support

- **Render Docs**: https://render.com/docs
- **PsyFi Issues**: https://github.com/scrimshawlife-ctrl/Psy-Fi/issues
- **Render Status**: https://status.render.com

## Cost Estimate

- **Free Tier**: $0/month (sleeps after 15min inactivity)
- **Starter**: $7/month (always-on, 512MB RAM)
- **Standard**: $25/month (2GB RAM)
- **Pro**: $85/month (4GB RAM)

## Next Steps

After successful deployment:

1. ✅ Test all endpoints at `/docs`
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring/alerts
4. ✅ Share your deployed PsyFi! 🌀

---

**Applied Alchemy Labs**
ABX-Core v1.3 - Deterministic Consciousness Simulation
