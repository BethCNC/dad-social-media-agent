# Coolify Deployment Guide - AI Social Media Co-Pilot

## Quick Start Checklist

Before deploying, ensure you have:
- [ ] Coolify instance running
- [ ] Google API Key (Gemini)
- [ ] Creatomate API Key + Template IDs
- [ ] Ayrshare API Key
- [ ] Your production domain URL

## Step-by-Step Deployment

### 1. Create New Service in Coolify

1. Log into your Coolify dashboard
2. Click **"New Resource"** → **"Application"**
3. Select your Git repository source (GitHub/GitLab/etc.)
4. Choose the repository: `unicity-agent`
5. Select branch: `stoic-solomon` (or your main branch)

### 2. Configure Build Settings

**Build Pack:** Docker

**Dockerfile Location:** `deploy/Dockerfile`

**Port:** `8000`

**Health Check Path:** `/health`

**Health Check Settings:**
- Interval: 30 seconds
- Timeout: 10 seconds
- Start Period: 5 seconds
- Retries: 3

### 3. Set Environment Variables

In Coolify's Environment Variables section, add the following:

#### Required Variables (CRITICAL - App won't work without these)

```bash
# Google AI Studio (for Gemini 3.0 Pro + Nano Banana Pro)
GOOGLE_API_KEY=your_google_api_key_here

# Creatomate (Video & Image Rendering)
CREATOMATE_API_KEY=your_creatomate_api_key_here
CREATOMATE_IMAGE_TEMPLATE_ID=your_image_template_id_here
CREATOMATE_VIDEO_TEMPLATE_ID=your_video_template_id_here

# Ayrshare (Social Media Publishing)
AYRSHARE_API_KEY=your_ayrshare_api_key_here

# Application Settings
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com
ENV=production
```

#### Optional Variables

```bash
# Logging
LOG_LEVEL=INFO

# Port (default: 8000)
PORT=8000

# Audio Mode Options:
# - AUTO_STOCK_ONLY
# - AUTO_STOCK_WITH_TIKTOK_HINTS (default)
# - MUTED_FOR_PLATFORM_MUSIC
AUDIO_MODE=AUTO_STOCK_WITH_TIKTOK_HINTS

# Apify (Trend Surveillance - Optional)
APIFY_API_TOKEN=your_apify_token_here

# Creatomate Default Music (Optional)
CREATOMATE_DEFAULT_MUSIC=https://your-audio-url.mp3
```

### 4. Configure Domain

1. In Coolify, go to your application's **Domains** section
2. Add your custom domain: `your-domain.com`
3. Enable **HTTPS/SSL** (Coolify handles this automatically)
4. Ensure the domain matches `FRONTEND_URL` and `API_BASE_URL` in environment variables

### 5. Deploy

1. Click **"Deploy"** button
2. Monitor build logs for any errors
3. Wait for health check to pass (green status)

**Build Time:** Approximately 5-10 minutes for first deployment

### 6. Verify Deployment

Once deployed, verify the following:

#### Health Check
```bash
curl https://your-domain.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### Frontend
Visit: `https://your-domain.com`
- Should load the React dashboard
- No console errors
- Should see the main navigation

#### API Endpoints
```bash
# Check holidays loaded
curl https://your-domain.com/api/holidays

# Check dashboard stats
curl https://your-domain.com/api/dashboard
```

## Post-Deployment Configuration

### 1. Creatomate Template Setup

If you haven't already set up Creatomate templates:

1. Log into [Creatomate](https://creatomate.com)
2. Create **Image Template** (9:16 aspect ratio)
   - Copy Template ID → Set as `CREATOMATE_IMAGE_TEMPLATE_ID`
3. Create **Video Template** (9:16 aspect ratio)
   - Copy Template ID → Set as `CREATOMATE_VIDEO_TEMPLATE_ID`

See `docs/creatomate-setup.md` for detailed template configuration.

### 2. Ayrshare Platform Connection

1. Log into [Ayrshare](https://www.ayrshare.com)
2. Connect your social media accounts:
   - TikTok
   - Instagram
3. Copy your API Key → Set as `AYRSHARE_API_KEY`

### 3. Test User Flow

**Complete User Journey Test:**

1. **Navigate to Dashboard**
   - URL: `https://your-domain.com`
   - Verify dashboard loads with stats

2. **Generate Monthly Plan**
   - Click "Plan Content"
   - Fill in brand details
   - Submit and verify plan generation

3. **Generate Weekly Schedule**
   - Select a plan
   - Click "Generate Week"
   - Verify content ideas appear

4. **Create Content**
   - Select a content idea
   - Generate script with AI
   - Generate visuals (image/video)
   - Preview final content

5. **Schedule Post**
   - Select platform (TikTok/Instagram)
   - Choose date/time
   - Submit and verify scheduling

## Troubleshooting

### Build Fails

**Issue:** Dockerfile not found
- **Solution:** Ensure `deploy/Dockerfile` exists in repository
- Check Coolify build path is set to repository root

**Issue:** npm ci fails
- **Solution:** Ensure `frontend/package-lock.json` is committed
- Check Node version compatibility (requires Node 20)

**Issue:** pip install fails
- **Solution:** Verify `backend/requirements.txt` is present
- Check Python version (requires 3.10+)

### Health Check Fails

**Issue:** Health check timeout
- **Solution:**
  - Check logs: `docker logs <container_id>`
  - Verify port 8000 is exposed
  - Ensure uvicorn is starting correctly
  - Check database initialization logs

**Issue:** 500 errors on /health
- **Solution:** Missing required environment variables
- Check logs for specific error messages

### Runtime Issues

**Issue:** Frontend loads but shows blank page
- **Solution:**
  - Check browser console for errors
  - Verify `VITE_API_BASE_URL` matches production domain
  - Check CORS settings in backend

**Issue:** API calls fail with CORS errors
- **Solution:**
  - Ensure `FRONTEND_URL` matches your domain exactly
  - Check backend CORS configuration in `app/main.py`
  - Verify HTTPS is enabled

**Issue:** Content generation fails
- **Solution:**
  - Verify `GOOGLE_API_KEY` is valid
  - Check Gemini API quota/limits
  - Review logs for API error messages

**Issue:** Video rendering fails
- **Solution:**
  - Verify `CREATOMATE_API_KEY` is valid
  - Check template IDs are correct
  - Ensure templates are configured properly
  - Review `docs/creatomate-setup.md`

**Issue:** Social scheduling fails
- **Solution:**
  - Verify `AYRSHARE_API_KEY` is valid
  - Ensure social accounts are connected in Ayrshare
  - Check account permissions

### Database Issues

**Issue:** SQLite database file permissions
- **Solution:**
  - Ensure container has write permissions
  - Check volume mounts if using persistent storage
  - Review logs for "Permission denied" errors

**Issue:** Database not initializing
- **Solution:**
  - Check logs for `init_db()` errors
  - Verify SQLAlchemy configuration
  - Ensure `/app/backend/content.db` path is writable

## Persistent Storage (Important!)

**Current Setup:** SQLite database and image uploads are stored locally in the container.

**For Production Persistence:**

1. **Database Volume:**
   - Add volume mount: `/app/backend/content.db`
   - This prevents data loss on redeployment

2. **Image Uploads Volume:**
   - Add volume mount: `/app/static/uploads`
   - This preserves generated images across deployments

**To add in Coolify:**
1. Go to your application settings
2. Add **Persistent Storage**:
   - Path: `/app/backend/content.db`
   - Path: `/app/static/uploads`

## Scaling Considerations

**Current Limitations:**
- SQLite database (not suitable for multi-instance)
- Local file storage (not suitable for load balancing)

**For High-Traffic/Multi-Instance:**
1. Migrate to PostgreSQL
2. Use object storage (S3/Cloudflare R2) for uploads
3. Configure Redis for caching
4. Enable horizontal scaling in Coolify

## Monitoring

**Key Metrics to Watch:**

1. **Health Check Status:** Should always be green
2. **Response Times:** API should respond < 2s
3. **Error Logs:** Monitor for:
   - API key errors (Gemini, Creatomate, Ayrshare)
   - Database errors
   - Content generation failures
4. **Resource Usage:**
   - CPU: Normal < 50%
   - Memory: Normal < 512MB
   - Disk: Monitor uploads directory growth

**Coolify Monitoring:**
- Check application logs regularly
- Set up email/webhook alerts for failures
- Monitor deployment history

## Rollback Plan

If deployment fails or issues occur:

1. **Quick Rollback:**
   - In Coolify, click "Rollback" to previous deployment
   - Or deploy previous Git commit

2. **Emergency Fix:**
   - Fix issue locally
   - Push to repository
   - Coolify will auto-deploy (if auto-deploy enabled)

3. **Manual Intervention:**
   - Access container logs: Coolify → Application → Logs
   - SSH into server if needed
   - Check database integrity

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | - | Google AI Studio API key for Gemini |
| `CREATOMATE_API_KEY` | Yes | - | Creatomate API key for rendering |
| `CREATOMATE_IMAGE_TEMPLATE_ID` | Yes | - | Template ID for image rendering |
| `CREATOMATE_VIDEO_TEMPLATE_ID` | Yes | - | Template ID for video rendering |
| `AYRSHARE_API_KEY` | Yes | - | Ayrshare API key for publishing |
| `FRONTEND_URL` | Yes | - | Production domain URL |
| `API_BASE_URL` | Yes | - | Production domain URL (same as FRONTEND_URL) |
| `ENV` | Yes | `development` | Set to `production` |
| `PORT` | No | `8000` | Application port |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `AUDIO_MODE` | No | `AUTO_STOCK_WITH_TIKTOK_HINTS` | Audio handling mode |
| `APIFY_API_TOKEN` | No | - | Apify token for trend surveillance |
| `CREATOMATE_DEFAULT_MUSIC` | No | - | Default background music URL |

## Support & Documentation

- **Troubleshooting:** See `docs/TROUBLESHOOTING.md`
- **Creatomate Setup:** See `docs/creatomate-setup.md`
- **Audio Configuration:** See `docs/audio-legal-notes.md`
- **Main README:** See `README.md`

## Quick Commands

```bash
# View logs
docker logs <container_id>

# Test health check
curl https://your-domain.com/health

# Check API endpoints
curl https://your-domain.com/api/holidays
curl https://your-domain.com/api/dashboard

# Rebuild and deploy
git push origin stoic-solomon  # If auto-deploy enabled
```

## Success Criteria

Your deployment is successful when:

- [ ] Health check returns 200 OK
- [ ] Dashboard loads at `https://your-domain.com`
- [ ] Can generate monthly content plan
- [ ] Can generate weekly schedule
- [ ] Can create content with AI
- [ ] Can generate images/videos
- [ ] Can schedule posts to social media
- [ ] No errors in browser console
- [ ] No errors in server logs

## Next Steps After Deployment

1. Test complete user flow (plan → schedule → create → publish)
2. Invite beta users for testing
3. Monitor error logs for first 24 hours
4. Set up automated backups for database
5. Configure monitoring alerts
6. Document any custom workflows
7. Plan for scaling if needed

---

**Need Help?**
- Check logs in Coolify dashboard
- Review `docs/TROUBLESHOOTING.md`
- Verify all environment variables are set correctly
- Test API endpoints individually
