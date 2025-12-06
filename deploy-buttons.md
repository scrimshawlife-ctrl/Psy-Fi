# 🚀 One-Click Deployment Buttons

Deploy PsyFi to your preferred cloud platform with a single click.

---

## ☁️ Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/scrimshawlife-ctrl/Psy-Fi)

**Features:**
- ✅ Free tier available
- ✅ Auto-deploys from Git
- ✅ Built-in SSL certificates
- ✅ Global CDN
- ✅ Zero-downtime deploys

**Setup:**
1. Click button above
2. Connect your GitHub account
3. Select repository branch
4. Click "Create Web Service"
5. Wait 2-5 minutes for deployment

**Cost:** Free tier (512MB RAM) or $7/month (Starter)

---

## 🔵 Deploy to Azure

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fscrimshawlife-ctrl%2FPsy-Fi%2Fmain%2Fazure-deploy.json)

**Features:**
- ✅ Enterprise-grade reliability
- ✅ Global Azure network
- ✅ Integration with Azure services
- ✅ Advanced monitoring and analytics
- ✅ Auto-scaling

**Setup:**
1. Click button above
2. Sign in to Azure Portal
3. Fill in deployment details:
   - Subscription
   - Resource group (create new)
   - Region (recommend: East US)
   - App name (e.g., "psyfi-api")
4. Review and create
5. Wait 5-10 minutes for deployment

**Alternative CLI Deployment:**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Deploy
az webapp up --runtime PYTHON:3.11 --sku B1 --name psyfi-api --location eastus
```

**Cost:** ~$13/month (Basic B1) or ~$55/month (Standard S1)

---

## ☁️ Deploy to Google Cloud

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run?git_repo=https://github.com/scrimshawlife-ctrl/Psy-Fi)

**Features:**
- ✅ Serverless auto-scaling
- ✅ Pay only for what you use
- ✅ Global Google network
- ✅ Container-based deployment
- ✅ Built-in CI/CD

**Setup (App Engine):**
1. Install Google Cloud SDK:
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. Deploy:
   ```bash
   cd Psy-Fi
   gcloud app deploy
   ```

3. View:
   ```bash
   gcloud app browse
   ```

**Setup (Cloud Run):**
```bash
# Build and deploy
gcloud run deploy psyfi-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000
```

**Cost:**
- App Engine: ~$25/month (F2 instance)
- Cloud Run: Pay-per-request (~$5-20/month typical)

---

## 🎯 Quick Comparison

| Platform | Free Tier | Ease of Setup | Auto-scaling | Cost/Month | Best For |
|----------|-----------|---------------|--------------|------------|----------|
| **Render** | ✅ Yes | ⭐⭐⭐⭐⭐ | Limited | $0-7 | Quick deploys, small projects |
| **Azure** | ❌ No | ⭐⭐⭐⭐ | ✅ Yes | $13-55 | Enterprise, Microsoft ecosystem |
| **Google Cloud** | ⚠️ Trial | ⭐⭐⭐ | ✅ Yes | $5-25 | Serverless, variable traffic |

---

## 🔧 Manual Deployment

For VPS, DigitalOcean, or custom infrastructure, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive deployment guide
- [RENDER_DEPLOY.md](RENDER_DEPLOY.md) - Render-specific guide
- [scripts/README_RENDER_API.md](scripts/README_RENDER_API.md) - Render API automation

---

## 🆘 Need Help?

- **Render Issues**: Check [dashboard.render.com](https://dashboard.render.com/)
- **Azure Issues**: Check [portal.azure.com](https://portal.azure.com/)
- **Google Cloud Issues**: Check [console.cloud.google.com](https://console.cloud.google.com/)
- **General Help**: [Open an issue](https://github.com/scrimshawlife-ctrl/Psy-Fi/issues)

---

**Applied Alchemy Labs - ABX-Core v1.3**
