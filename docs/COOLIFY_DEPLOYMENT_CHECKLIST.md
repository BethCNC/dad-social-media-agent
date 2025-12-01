# Coolify Deployment Checklist

Since you already have all API keys in `.env` and Creatomate templates set up, use this checklist to deploy to Coolify.

## Quick Reference: What to Copy from .env to Coolify

From your `.env` file, you'll need to copy these values to Coolify:

### Required Environment Variables (in Coolify UI)

Copy these exact variable names and values from your `.env`:

```bash
GOOGLE_API_KEY=                    # Copy from .env
CREATOMATE_API_KEY=                # Copy from .env
CREATOMATE_IMAGE_TEMPLATE_ID=      # Copy from .env
CREATOMATE_VIDEO_TEMPLATE_ID=      # Copy from .env
AYRSHARE_API_KEY=                  # Copy from .env
```

### Production-Specific Variables (Update for Production)

These need to be changed from localhost to your production domain:

```bash
FRONTEND_URL=https://your-domain.com          # Change from localhost
API_BASE_URL=https://your-domain.com          # Change from localhost
ENV=production                                 # Change from development
PORT=8000                                      # Keep as is (or copy from .env)
LOG_LEVEL=INFO                                 # Keep as is (or copy from .env)
```

### Optional Variables (Copy if Present in .env)

```bash
AUDIO_MODE=                                    # Copy from .env if present
APIFY_API_TOKEN=                               # Copy from .env if present
CREATOMATE_DEFAULT_MUSIC=                      # Copy from .env if present
```

---

## Step-by-Step Deployment

### Step 1: Create Service in Coolify (2 min)

1. Log into Coolify
2. Click **"New Resource"** → **"Application"**
3. Select your Git source (GitHub/GitLab)
4. Choose repository: `dad-social-media-agent`
5. Select branch: **`stoic-solomon`** ⚠️ (Important: Use this branch!)

### Step 2: Configure Build Settings (1 min)

In Coolify, set these values:

```
Build Pack: Docker
Dockerfile Location: deploy/Dockerfile
Port: 8000
Health Check Path: /health
```

**Health Check Settings:**
- Interval: 30 seconds
- Timeout: 10 seconds
- Start Period: 5 seconds
- Retries: 3

### Step 3: Set Environment Variables (5 min)

**⚠️ CRITICAL: Two Places to Set Variables!**

#### A. Regular Environment Variables

In Coolify's **"Environment Variables"** section, add:

1. Open your `.env` file
2. Copy each value below and paste into Coolify:

| Variable Name | Value Source |
|--------------|--------------|
| `GOOGLE_API_KEY` | Copy from `.env` |
| `CREATOMATE_API_KEY` | Copy from `.env` |
| `CREATOMATE_IMAGE_TEMPLATE_ID` | Copy from `.env` |
| `CREATOMATE_VIDEO_TEMPLATE_ID` | Copy from `.env` |
| `AYRSHARE_API_KEY` | Copy from `.env` |
| `FRONTEND_URL` | **Change to:** `https://your-domain.com` |
| `API_BASE_URL` | **Change to:** `https://your-domain.com` |
| `ENV` | **Change to:** `production` |
| `PORT` | Copy from `.env` (or use `8000`) |
| `LOG_LEVEL` | Copy from `.env` (or use `INFO`) |

**Optional (if in your .env):**
- `AUDIO_MODE` - Copy from `.env`
- `APIFY_API_TOKEN` - Copy from `.env`
- `CREATOMATE_DEFAULT_MUSIC` - Copy from `.env`

#### B. Build Arguments (⚠️ SEPARATE SECTION!)

In Coolify, find **"Build Arguments"** section (different from Environment Variables):

Add this ONE variable:

```
VITE_API_BASE_URL=https://your-domain.com
```

**Important:** This must match your production domain exactly!

### Step 4: Configure Domain (2 min)

1. In Coolify, go to **"Domains"** section
2. Add your domain: `your-domain.com`
3. Enable **HTTPS/SSL** (Coolify handles this automatically)
4. **Verify:** This domain matches `FRONTEND_URL` and `API_BASE_URL` exactly

### Step 5: Configure Persistent Storage (1 min)

Add these volume mounts to preserve data:

1. Go to **"Storage"** or **"Volumes"** section in Coolify
2. Add mount: `/app/backend/content.db`
3. Add mount: `/app/static/uploads`

**Why:** Without these, your database and generated images will be lost on redeployment!

### Step 6: Deploy! (5-10 min)

1. Click **"Deploy"** button
2. Watch build logs for errors
3. Wait for health check to pass (green status)

**Expected build time:** 5-10 minutes for first build

### Step 7: Verify Deployment (2 min)

Once deployed, test:

```bash
# Health check
curl https://your-domain.com/health

# Should return: {"status":"healthy","version":"1.0.0"}
```

Or run the verification script:
```bash
./deploy/verify-deployment.sh https://your-domain.com
```

---

## Common Issues & Quick Fixes

### Build Fails
- **Check:** Dockerfile location is `deploy/Dockerfile`
- **Check:** Branch is `stoic-solomon`

### Health Check Fails
- **Check:** All environment variables are set (no typos)
- **Check:** `VITE_API_BASE_URL` is in Build Arguments (not just Environment Variables)
- **Check:** Logs for specific error messages

### Frontend Blank Page
- **Check:** `VITE_API_BASE_URL` is set in **Build Arguments**
- **Check:** Browser console for errors
- **Check:** CORS settings (`FRONTEND_URL` matches domain)

### API Errors
- **Check:** API keys are correct (no extra spaces)
- **Check:** Creatomate template IDs are correct
- **Check:** Ayrshare accounts are connected

---

## Pre-Deployment Checklist

Before clicking "Deploy", verify:

- [ ] Branch is set to `stoic-solomon`
- [ ] Dockerfile location: `deploy/Dockerfile`
- [ ] All API keys copied from `.env` to Environment Variables
- [ ] `FRONTEND_URL` and `API_BASE_URL` set to production domain
- [ ] `ENV=production` is set
- [ ] `VITE_API_BASE_URL` is set in **Build Arguments** (separate section!)
- [ ] Domain is configured in Coolify
- [ ] Persistent storage is configured (2 volumes)
- [ ] Health check path is `/health`

---

## After Deployment

1. **Test health check:** `curl https://your-domain.com/health`
2. **Open in browser:** `https://your-domain.com`
3. **Test user flow:**
   - Generate monthly plan
   - Generate weekly schedule
   - Create content with AI
   - Generate images/videos
   - Schedule social posts

---

## Need Help?

- **Build issues:** Check Coolify build logs
- **Runtime issues:** Check Coolify application logs
- **Detailed guide:** See `COOLIFY_DEPLOYMENT.md`
- **Troubleshooting:** See `docs/TROUBLESHOOTING.md`

---

**Ready? Start with Step 1!** 🚀

