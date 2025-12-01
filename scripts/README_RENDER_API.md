# Deploy PsyFi to Render via API

Automated deployment script for Render using their REST API.

## Quick Start

### 1. Get Your Render API Key

1. Go to https://dashboard.render.com/account/api-keys
2. Click **"Create API Key"**
3. Give it a name (e.g., "PsyFi Deploy")
4. Copy the key (starts with `rnd_`)

### 2. Set Environment Variable

```bash
export RENDER_API_KEY="rnd_xxxxxxxxxxxxxxxxxxxxx"
```

**Make it permanent** (add to `~/.bashrc` or `~/.zshrc`):
```bash
echo 'export RENDER_API_KEY="rnd_xxxxxxxxxxxxxxxxxxxxx"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Run Deployment Script

```bash
# Make sure you're in the Psy-Fi directory
cd /path/to/Psy-Fi

# Run the deployment script
python scripts/render_deploy.py
```

## What the Script Does

1. **Checks for Existing Service**
   - Searches for a service named "psyfi-api"
   - If found, offers to redeploy
   - If not found, creates a new service

2. **Creates/Updates Service**
   - **Name**: psyfi-api
   - **Repository**: https://github.com/scrimshawlife-ctrl/Psy-Fi
   - **Branch**: claude/psyfi-consciousness-engine-01ReVCzCr3nK4gtWiPMjxvAv
   - **Region**: Oregon
   - **Plan**: Starter ($7/month)
   - **Environment**: Python 3.11

3. **Configures Build**
   - Build command: `pip install --upgrade pip && pip install -r requirements.txt`
   - Start command: `uvicorn psyfi_api.main:app --host 0.0.0.0 --port $PORT`
   - Health check: `/health`

4. **Sets Environment Variables**
   ```
   ENVIRONMENT=production
   LOG_LEVEL=info
   ENABLE_SAFETY_CLAMP=true
   PYTHON_VERSION=3.11.0
   ```

5. **Monitors Deployment**
   - Polls deploy status every 10 seconds
   - Shows progress updates
   - Times out after 10 minutes
   - Reports success or failure

## Expected Output

```
╔════════════════════════════════════════╗
║   PsyFi Render Deployment via API     ║
║   Applied Alchemy Labs - ABX v1.3      ║
╚════════════════════════════════════════╝

🔍 Checking for existing service...
No existing service found.

Repository URL [https://github.com/scrimshawlife-ctrl/Psy-Fi]:
Branch [claude/psyfi-consciousness-engine-01ReVCzCr3nK4gtWiPMjxvAv]:

🚀 Creating service 'psyfi-api'...
✅ Service created: srv-xxxxxxxxxxxxxxxxxxxxx
🔄 Triggering deploy for service srv-xxxxxxxxxxxxxxxxxxxxx...
✅ Deploy triggered: dep-xxxxxxxxxxxxxxxxxxxxx
⏳ Waiting for deploy to complete (timeout: 600s)...
   Status: building
   Status: live
✅ Deploy successful!

🎉 Deployment successful!
   Service URL: https://psyfi-api.onrender.com
   Health check: https://psyfi-api.onrender.com/health
   Docs: https://psyfi-api.onrender.com/docs

✨ Done!
```

## Redeploy Existing Service

If you run the script again with an existing service:

```bash
python scripts/render_deploy.py
```

Output:
```
🔍 Checking for existing service...
✅ Found existing service: srv-xxxxxxxxxxxxxxxxxxxxx
   URL: https://psyfi-api.onrender.com

Trigger redeploy? [y/N]: y
🔄 Triggering deploy for service srv-xxxxxxxxxxxxxxxxxxxxx...
✅ Deploy triggered: dep-xxxxxxxxxxxxxxxxxxxxx
⏳ Waiting for deploy to complete...
   Status: building
   Status: live
✅ Deploy successful!
```

## Programmatic Usage

You can also use the deployer in your own scripts:

```python
from scripts.render_deploy import RenderDeployer

# Initialize with API key
deployer = RenderDeployer(api_key="rnd_xxxxxxxxxxxxxxxxxxxxx")

# Check for existing service
service = deployer.find_service_by_name("psyfi-api")

if service:
    # Redeploy existing service
    service_id = service["id"]
    deployer.trigger_deploy(service_id)
    deployer.wait_for_deploy(service_id)
else:
    # Create new service
    service = deployer.create_service(
        name="psyfi-api",
        repo_url="https://github.com/scrimshawlife-ctrl/Psy-Fi",
        branch="claude/psyfi-consciousness-engine-01ReVCzCr3nK4gtWiPMjxvAv",
    )
    service_id = service["id"]
    deployer.wait_for_deploy(service_id)

# Get service URL
url = deployer.get_service_url(service_id)
print(f"Deployed to: {url}")
```

## Troubleshooting

### "RENDER_API_KEY environment variable not set"

**Solution**: Follow Step 2 above to set your API key.

### "HTTP Error 401: Unauthorized"

**Cause**: Invalid or expired API key

**Solution**:
1. Go to https://dashboard.render.com/account/api-keys
2. Verify your API key is active
3. Generate a new key if needed
4. Update your environment variable

### "HTTP Error 403: Forbidden"

**Cause**: API key doesn't have permission to create services

**Solution**: Ensure you're using an API key from the correct account with appropriate permissions.

### "HTTP Error 422: Unprocessable Entity"

**Cause**: Invalid service configuration

**Solution**: Check the error response for details. Common issues:
- Invalid repository URL
- Branch doesn't exist
- Invalid region name

### Deploy Stuck at "building" Status

**Cause**: Build is taking longer than expected

**Solution**:
1. Check Render dashboard logs: https://dashboard.render.com/
2. Look for build errors (missing dependencies, syntax errors)
3. Script will timeout after 10 minutes and report failure

### "Service already exists" Error

**Cause**: Service name "psyfi-api" is taken in your account

**Solution**:
- Script will find and offer to redeploy existing service
- Or, modify script to use different service name

## API Rate Limits

Render API rate limits:
- **Free tier**: 100 requests/hour
- **Paid tier**: 1000 requests/hour

The deployment script makes approximately 10-30 requests per deploy, so you can safely deploy multiple times per hour.

## Manual API Testing

Test your API key:

```bash
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services
```

Should return JSON list of your services.

## Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for API keys
3. **Rotate keys regularly** (every 90 days recommended)
4. **Limit key scope** if possible (Render currently uses account-level keys)
5. **Revoke old keys** after rotation

## Resources

- **Render API Docs**: https://api-docs.render.com/
- **Render Dashboard**: https://dashboard.render.com/
- **Render Status**: https://status.render.com/
- **Support**: https://render.com/support

---

**Applied Alchemy Labs**
ABX-Core v1.3 - Deterministic Consciousness Simulation
