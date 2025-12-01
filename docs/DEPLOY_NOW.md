# 🚀 DEPLOY TO COOLIFY NOW - Quick Start

## ⏱️ Time to Deploy: 15-20 minutes

Follow these steps in order. Don't skip any!

---

## STEP 1: Gather Your API Keys (5 minutes)

Before you start, get these API keys ready:

### ✅ Required Keys:

| Service | Get Key From | What It's For |
|---------|--------------|---------------|
| **Google AI Studio** | https://aistudio.google.com/app/apikey | AI content generation (Gemini) |
| **Creatomate** | https://creatomate.com/dashboard | Video/image rendering |
| **Ayrshare** | https://www.ayrshare.com/dashboard | Social media publishing |

### 📋 What You'll Need From Creatomate:
1. API Key
2. Image Template ID (9:16 aspect ratio)
3. Video Template ID (9:16 aspect ratio)

> **Don't have templates yet?** See `docs/creatomate-setup.md` for quick setup.

---

## STEP 2: Create Service in Coolify (2 minutes)

1. **Log into Coolify**
2. **Click** "New Resource" → "Application"
3. **Select** your Git source (GitHub/GitLab)
4. **Choose** this repository
5. **Select** branch: `stoic-solomon`

---

## STEP 3: Configure Build (1 minute)

Set these values in Coolify:

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

---

## STEP 4: Set Environment Variables (5 minutes)

Copy `.env.production` and fill in your values, then add to Coolify:

### 🔴 CRITICAL - Must Set These:

```bash
# Google AI
GOOGLE_API_KEY=your_actual_google_key_here

# Creatomate
CREATOMATE_API_KEY=your_actual_creatomate_key_here
CREATOMATE_IMAGE_TEMPLATE_ID=your_actual_template_id_here
CREATOMATE_VIDEO_TEMPLATE_ID=your_actual_template_id_here

# Ayrshare
AYRSHARE_API_KEY=your_actual_ayrshare_key_here

# Your Domain (CHANGE THIS!)
FRONTEND_URL=https://your-coolify-domain.com
API_BASE_URL=https://your-coolify-domain.com

# Production Mode
ENV=production
PORT=8000
```

### 🟢 IMPORTANT - Build Argument:

In Coolify, under **Build Arguments**, add:

```bash
VITE_API_BASE_URL=https://your-coolify-domain.com
```

This bakes the API URL into the frontend build.

### 🟡 Optional (Can Add Later):

```bash
LOG_LEVEL=INFO
AUDIO_MODE=AUTO_STOCK_WITH_TIKTOK_HINTS
```

---

## STEP 5: Configure Domain (2 minutes)

1. Go to **Domains** section in Coolify
2. Add your domain: `your-domain.com`
3. Enable **HTTPS/SSL** (automatic)
4. **IMPORTANT:** Make sure this matches `FRONTEND_URL` and `API_BASE_URL` exactly

---

## STEP 6: Configure Persistent Storage (1 minute)

Add these volume mounts to preserve data across deployments:

1. Go to **Storage** section
2. Add mount: `/app/backend/content.db`
3. Add mount: `/app/static/uploads`

---

## STEP 7: Deploy! (5-10 minutes)

1. **Click** "Deploy" button
2. **Watch** build logs for errors
3. **Wait** for health check to pass (green status)

**Expected build time:** 5-10 minutes

---

## STEP 8: Verify Deployment (2 minutes)

Run the verification script:

```bash
./deploy/verify-deployment.sh https://your-domain.com
```

Or manually test:

```bash
# Health check
curl https://your-domain.com/health

# Should return: {"status":"healthy","version":"1.0.0"}
```

**In Browser:**
1. Visit `https://your-domain.com`
2. Dashboard should load
3. No errors in console

---

## STEP 9: Test User Flow (5 minutes)

Complete this checklist to ensure everything works:

- [ ] Dashboard loads and shows stats
- [ ] Can navigate to "Plan Content"
- [ ] Can generate monthly content plan
- [ ] Can generate weekly schedule
- [ ] Can create content with AI
- [ ] Can generate images
- [ ] Can generate videos
- [ ] Can schedule posts to social media
- [ ] No errors in browser console
- [ ] No errors in Coolify logs

---

## 🎉 SUCCESS CRITERIA

Your app is live when:

✅ Health check is green in Coolify
✅ Dashboard loads at your domain
✅ Can complete full content creation flow
✅ Can schedule posts to TikTok/Instagram
✅ No errors in logs or console

---

## 🆘 TROUBLESHOOTING

### Build Fails

**Problem:** "Dockerfile not found"
- **Fix:** Ensure `deploy/Dockerfile` exists
- Check build path is repository root

**Problem:** "npm ci failed"
- **Fix:** Ensure `frontend/package-lock.json` is committed
- Try: `npm install` locally first

**Problem:** "pip install failed"
- **Fix:** Check `backend/requirements.txt` exists
- Verify Python 3.10+ compatibility

### Health Check Fails

**Problem:** Health check timeout
- **Fix:** Check Coolify logs for startup errors
- Verify port 8000 is exposed
- Check environment variables are set

**Problem:** 500 error on /health
- **Fix:** Missing required API keys
- Check logs: Look for "KeyError" or "ValidationError"

### Frontend Issues

**Problem:** Blank page or "Failed to fetch"
- **Fix:** VITE_API_BASE_URL not set correctly
- **Fix:** Check CORS settings (FRONTEND_URL must match domain)
- **Fix:** Verify HTTPS is enabled

**Problem:** API calls return 404
- **Fix:** Check API_BASE_URL environment variable
- **Fix:** Ensure backend is running (check logs)

### Content Generation Fails

**Problem:** "Invalid API key" errors
- **Fix:** Verify Google API key is valid
- **Fix:** Check Gemini API is enabled
- **Fix:** Verify API quota/limits

**Problem:** Video rendering fails
- **Fix:** Verify Creatomate API key
- **Fix:** Check template IDs are correct
- **Fix:** Ensure templates are 9:16 aspect ratio

**Problem:** Social scheduling fails
- **Fix:** Verify Ayrshare API key
- **Fix:** Ensure TikTok/Instagram are connected in Ayrshare
- **Fix:** Check account permissions

---

## 📚 DETAILED DOCUMENTATION

For more details, see:
- **Full Guide:** `COOLIFY_DEPLOYMENT.md`
- **Creatomate Setup:** `docs/creatomate-setup.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Main README:** `README.md`

---

## 🔄 REDEPLOYMENT

To redeploy after changes:

1. **Commit** your changes to Git
2. **Push** to repository
3. Coolify will **auto-deploy** (if enabled)
4. Or click **"Redeploy"** in Coolify

---

## 📊 MONITORING

**What to watch:**
- Health check status (should always be green)
- Error logs in Coolify
- Resource usage (CPU/Memory)
- API response times

**Set up alerts for:**
- Health check failures
- High error rates
- Resource limits

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Test thoroughly** with beta users
2. **Monitor logs** for first 24 hours
3. **Set up backups** for database
4. **Configure alerts** in Coolify
5. **Document** any issues found
6. **Plan scaling** if needed (PostgreSQL, object storage)

---

## 🚨 EMERGENCY ROLLBACK

If something goes wrong:

1. In Coolify, click **"Rollback"**
2. Select previous deployment
3. Click **"Redeploy"**

Or:

1. Revert Git commit locally
2. Push to repository
3. Redeploy

---

## ✅ PRE-FLIGHT CHECKLIST

Before clicking "Deploy", verify:

- [ ] All required API keys are ready
- [ ] Domain is configured in Coolify
- [ ] Environment variables are set (including VITE_API_BASE_URL)
- [ ] Build arguments include VITE_API_BASE_URL
- [ ] Persistent storage is configured
- [ ] Health check settings are correct
- [ ] Creatomate templates are created
- [ ] Ayrshare accounts are connected
- [ ] Reviewed `.env.production` template

---

## 💡 TIPS

- **First deployment?** Start with development mode first to test
- **API keys not working?** Double-check for typos or extra spaces
- **Build taking too long?** Normal for first build (downloads all dependencies)
- **Health check failing?** Check logs immediately - usually environment variables
- **Need help?** Check `docs/TROUBLESHOOTING.md` first

---

**Ready? Let's deploy! 🚀**

Start with Step 1 and work through each step carefully.

Questions? See `COOLIFY_DEPLOYMENT.md` for detailed explanations.
