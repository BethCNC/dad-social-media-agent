# Comprehensive Deployment Plan & Tech Stack Summary
## AI Social Media Co-Pilot

**Generated:** December 1, 2024  
**Project:** AI Social Media Co-Pilot for TikTok/Instagram Content Creation  
**Target User:** Older, non-technical clients needing simple social media content creation

---

## 📋 EXECUTIVE SUMMARY

The AI Social Media Co-Pilot is a full-stack web application that helps users create and schedule TikTok and Instagram content through an AI-powered wizard interface. The application uses Google Gemini 3.0 Pro for content generation, Creatomate for video rendering, and Ayrshare for social media publishing. It's deployed as a single Docker container via Coolify.

**Deployment Time:** 15-20 minutes  
**Deployment Target:** Coolify (self-hosted or cloud)  
**Architecture:** Monorepo with React frontend and FastAPI backend in single container

---

## 🛠️ COMPLETE TECH STACK

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | ^5.4.21 | Build tool and dev server |
| **Tailwind CSS** | ^3.4.1 | Utility-first CSS framework |
| **Radix UI** | Various | Accessible component primitives |
| **Lucide React** | ^0.555.0 | Icon library |
| **Axios** | ^1.13.2 | HTTP client for API calls |
| **React Router** | ^7.9.6 | Client-side routing |
| **date-fns** | ^3.0.0 | Date manipulation |

**Key Frontend Features:**
- Single Page Application (SPA) architecture
- Responsive design optimized for older users (large fonts, high contrast)
- Step-by-step wizard interface (5 steps: Brief → Script → Assets → Render → Schedule)
- Real-time status updates via polling
- Multimodal input support (text + image upload)

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109.0 | Modern Python web framework |
| **Uvicorn** | 0.27.0 | ASGI server |
| **Pydantic** | 2.5.3 | Data validation and settings |
| **httpx** | 0.26.0 | Async HTTP client |
| **Google GenAI SDK** | >=0.8.0 | Gemini 3.0 Pro and Nano Banana Pro integration |
| **SQLAlchemy** | 2.0.25 | ORM for database operations |
| **Alembic** | 1.13.1 | Database migrations |
| **Pillow** | >=10.0.0 | Image processing |
| **python-dotenv** | 1.0.0 | Environment variable management |
| **Apify Client** | >=1.0.0 | Trend surveillance (optional) |
| **iCalendar** | 5.0.11 | Holiday calendar parsing |

**Key Backend Features:**
- RESTful API with `/api` prefix
- Automatic CORS configuration
- Health check endpoint (`/health`)
- Static file serving for frontend
- SQLite database (production-ready, can scale to PostgreSQL)
- Automatic database initialization
- Structured logging

### Infrastructure & Deployment

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization (multi-stage build) |
| **Coolify** | Deployment platform (self-hosted PaaS) |
| **Git LFS** | Large file storage (videos, images) |
| **SQLite** | Database (MVP, scalable to PostgreSQL) |

**Docker Build Strategy:**
- **Stage 1:** Node.js 20 Alpine - Build React frontend to static files
- **Stage 2:** Python 3.10 Slim - Run FastAPI and serve static frontend
- **Result:** Single container with both frontend and backend

### External APIs & Services

| Service | Purpose | Models/Features |
|---------|---------|-----------------|
| **Google Gemini 3.0 Pro** | Text generation (scripts, captions, content plans) | `gemini-3-pro-preview` |
| **Nano Banana Pro** | Image generation from shot descriptions | `gemini-3-pro-image-preview` |
| **Creatomate** | Video/image rendering | Custom 9:16 templates |
| **Ayrshare** | Social media publishing | TikTok, Instagram scheduling |
| **Pexels** | Stock video fallback | Video search API |
| **Apify** | Trend surveillance (optional) | TikTok trend analysis |

---

## 🏗️ ARCHITECTURE OVERVIEW

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│  React SPA (Vite + TypeScript + Tailwind)               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│              FastAPI Backend (Python)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   API Routes │  │   Services   │  │   Database   │  │
│  │   /api/*     │  │  Business    │  │   SQLite     │  │
│  │              │  │   Logic      │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          │                  │
┌─────────▼──────────────────▼────────────────────────────┐
│              External APIs                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Gemini   │  │Creatomate│  │ Ayrshare │  │  Pexels  │ │
│  │ 3.0 Pro  │  │          │  │          │  │          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Project Structure

```
/unicity-agent
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── layout/         # Shell, Sidebar, TopBar
│   │   │   ├── forms/          # ContentBriefForm, etc.
│   │   │   ├── planning/       # ScriptPreview, CaptionPreview
│   │   │   ├── assets/         # AssetGrid
│   │   │   ├── video/          # RenderStatusCard
│   │   │   └── social/        # ScheduleForm
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   └── NewPostWizard.tsx
│   │   └── lib/                # API clients
│   │       ├── api.ts          # Axios instance
│   │       ├── contentApi.ts
│   │       ├── videoApi.ts
│   │       └── socialApi.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # FastAPI application
│   └── app/
│       ├── main.py             # FastAPI app, CORS, static files
│       ├── api/
│       │   └── v1/
│       │       ├── content.py  # /api/content/*
│       │       ├── assets.py   # /api/assets/*
│       │       ├── video.py     # /api/video/*
│       │       └── social.py    # /api/social/*
│       ├── core/
│       │   ├── config.py       # Settings & env vars
│       │   └── client_unicity_profile.json
│       ├── models/              # Pydantic schemas
│       │   ├── content.py
│       │   ├── video.py
│       │   └── social.py
│       ├── services/           # Business logic & API clients
│       │   ├── gemini_client.py
│       │   ├── creatomate_client.py
│       │   ├── ayrshare_client.py
│       │   ├── pexels_client.py
│       │   ├── content_service.py
│       │   └── video_service.py
│       ├── database/
│       │   ├── database.py     # DB initialization
│       │   ├── models.py       # SQLAlchemy models
│       │   └── content_repository.py
│       └── requirements.txt
│
├── static/                      # Runtime-generated files
│   └── uploads/                # AI-generated images
│
├── deploy/
│   ├── Dockerfile              # Multi-stage build
│   ├── docker-compose.yml      # Local development
│   └── verify-deployment.sh   # Deployment verification
│
└── docs/                        # Documentation
    ├── DEPLOY_NOW.md
    ├── COOLIFY_DEPLOYMENT.md
    └── [other docs]
```

### Data Flow

1. **Content Generation Flow:**
   ```
   User Input → Frontend → FastAPI → Gemini 3.0 Pro
   → Generated Plan (script, caption, shot plan)
   → Frontend displays
   ```

2. **Image Generation Flow:**
   ```
   Shot Descriptions → FastAPI → Nano Banana Pro
   → Generated Images → Saved to /static/uploads/
   → Served via /static/uploads/{filename}
   → Frontend displays
   ```

3. **Video Rendering Flow:**
   ```
   Selected Assets + Script → FastAPI → Creatomate API
   → Render Job ID → Polling until complete
   → Video URL → Frontend displays preview
   ```

4. **Social Publishing Flow:**
   ```
   Video URL + Caption → FastAPI → Ayrshare API
   → Scheduled Post → Confirmation to user
   ```

---

## 🚀 DETAILED DEPLOYMENT PLAN

### Pre-Deployment Requirements

#### 1. API Keys & Credentials

**Required:**
- ✅ Google AI Studio API Key (for Gemini 3.0 Pro and Nano Banana Pro)
- ✅ Creatomate API Key
- ✅ Creatomate Image Template ID (9:16 vertical format)
- ✅ Creatomate Video Template ID (9:16 vertical format)
- ✅ Ayrshare API Key
- ✅ Production domain URL

**Optional:**
- Apify API Token (for trend surveillance)
- Creatomate Default Music URL

#### 2. Creatomate Template Setup

**Image Template:**
- Dimensions: 1080x1920 (9:16 vertical)
- Elements: Background layers, text overlays
- Element names: `Background-1`, `Background-2`, `Text-1`, `Text-2`, etc.
- Variables: Dynamic content injection

**Video Template:**
- Dimensions: 1080x1920 (9:16 vertical)
- Elements: Video clip containers, text overlays
- Supports: Multiple video clips in sequence
- Variables: Video URLs, script text

**Reference:** See `docs/creatomate-setup.md` for detailed setup

#### 3. Ayrshare Account Setup

- Connect TikTok account
- Connect Instagram account
- Copy API key from dashboard

#### 4. Git Repository

- Branch: `stoic-solomon` (deployment-ready branch)
- Git LFS: Configured for large files
- All changes committed and pushed

---

### Deployment Steps (Coolify)

#### Step 1: Create Service in Coolify (2 minutes)

1. Log into Coolify dashboard
2. Click **"New Resource"** → **"Application"**
3. Select Git source (GitHub/GitLab)
4. Choose repository: `dad-social-media-agent`
5. Select branch: **`stoic-solomon`** ⚠️

#### Step 2: Configure Build Settings (1 minute)

**Build Configuration:**
```
Build Pack: Docker
Dockerfile Location: deploy/Dockerfile
Build Context: . (repository root)
Port: 8000
Health Check Path: /health
```

**Health Check Settings:**
- Interval: 30 seconds
- Timeout: 10 seconds
- Start Period: 5 seconds
- Retries: 3

#### Step 3: Set Environment Variables (5 minutes)

**⚠️ CRITICAL: Two Separate Sections!**

**A. Environment Variables (Runtime):**

Copy from your `.env` file and update for production:

```bash
# API Keys (copy from .env)
GOOGLE_API_KEY=your_google_api_key
CREATOMATE_API_KEY=your_creatomate_api_key
CREATOMATE_IMAGE_TEMPLATE_ID=your_image_template_id
CREATOMATE_VIDEO_TEMPLATE_ID=your_video_template_id
AYRSHARE_API_KEY=your_ayrshare_api_key

# Production URLs (CHANGE from localhost)
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com

# Production Settings
ENV=production
PORT=8000
LOG_LEVEL=INFO

# Optional
AUDIO_MODE=AUTO_STOCK_WITH_TIKTOK_HINTS
APIFY_API_TOKEN=your_apify_token (optional)
CREATOMATE_DEFAULT_MUSIC=https://your-music-url.mp3 (optional)
```

**B. Build Arguments (⚠️ SEPARATE SECTION!):**

In Coolify's **"Build Arguments"** section (NOT Environment Variables):

```bash
VITE_API_BASE_URL=https://your-domain.com
```

**Why:** This bakes the API URL into the frontend build at compile time.

#### Step 4: Configure Domain (2 minutes)

1. Go to **"Domains"** section in Coolify
2. Add your domain: `your-domain.com`
3. Enable **HTTPS/SSL** (automatic via Coolify)
4. **Verify:** Domain matches `FRONTEND_URL` and `API_BASE_URL` exactly

#### Step 5: Configure Persistent Storage (1 minute)

**Required Volume Mounts:**

1. Go to **"Storage"** or **"Volumes"** section
2. Add volume mount: `/app/backend/content.db` (database)
3. Add volume mount: `/app/static/uploads` (generated images)

**Why:** Without these, data is lost on redeployment.

#### Step 6: Deploy (5-10 minutes)

1. Click **"Deploy"** button
2. Monitor build logs in real-time
3. Watch for:
   - Frontend build completion
   - Python dependencies installation
   - Container startup
   - Health check passing (green status)

**Expected Build Time:**
- First build: 5-10 minutes (downloads all dependencies)
- Subsequent builds: 2-5 minutes (cached layers)

#### Step 7: Verify Deployment (2 minutes)

**Automated Verification:**
```bash
./deploy/verify-deployment.sh https://your-domain.com
```

**Manual Verification:**
```bash
# Health check
curl https://your-domain.com/health
# Expected: {"status":"healthy","version":"1.0.0"}

# API endpoints
curl https://your-domain.com/api/holidays
curl https://your-domain.com/api/dashboard
```

**Browser Verification:**
1. Visit `https://your-domain.com`
2. Dashboard should load
3. Check browser console for errors (should be empty)
4. Test navigation

#### Step 8: Test Complete User Flow (5 minutes)

**Test Checklist:**
- [ ] Dashboard loads and shows stats
- [ ] Navigate to "Plan Content"
- [ ] Generate monthly content plan (30 days)
- [ ] Generate weekly schedule (7 posts)
- [ ] Create content with AI (script generation)
- [ ] Generate images (AI image generation)
- [ ] Render video/image (Creatomate)
- [ ] Schedule post to TikTok/Instagram (Ayrshare)
- [ ] No errors in browser console
- [ ] No errors in Coolify logs

---

## 🔧 CONFIGURATION DETAILS

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ Yes | - | Google AI Studio API key for Gemini 3.0 Pro and Nano Banana Pro |
| `CREATOMATE_API_KEY` | ✅ Yes | - | Creatomate API key for video/image rendering |
| `CREATOMATE_IMAGE_TEMPLATE_ID` | ✅ Yes | - | Creatomate image template ID (9:16 format) |
| `CREATOMATE_VIDEO_TEMPLATE_ID` | ✅ Yes | - | Creatomate video template ID (9:16 format) |
| `AYRSHARE_API_KEY` | ✅ Yes | - | Ayrshare API key for social media publishing |
| `FRONTEND_URL` | ✅ Yes | `http://localhost:5173` | Production domain URL (for CORS) |
| `API_BASE_URL` | ✅ Yes | `http://localhost:8000` | Production domain URL (for image URLs) |
| `ENV` | ✅ Yes | `development` | Set to `production` |
| `PORT` | No | `8000` | Application port |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `AUDIO_MODE` | No | `AUTO_STOCK_WITH_TIKTOK_HINTS` | Audio handling mode |
| `APIFY_API_TOKEN` | No | - | Apify token for trend surveillance |
| `CREATOMATE_DEFAULT_MUSIC` | No | - | Default background music URL |

**Build Arguments:**
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ Yes | Frontend API base URL (baked into build) |

### Dockerfile Details

**Multi-Stage Build:**

**Stage 1 - Frontend Builder:**
- Base: `node:20-alpine`
- Actions:
  - Copy `package*.json`
  - Run `npm ci` (clean install)
  - Copy frontend source
  - Build with `npm run build`
  - Output: Static files in `/app/frontend/dist`

**Stage 2 - Runtime:**
- Base: `python:3.10-slim`
- Actions:
  - Install system dependencies
  - Copy `requirements.txt`
  - Install Python dependencies
  - Copy backend code
  - Copy built frontend from Stage 1 to `/app/static`
  - Set working directory to `/app/backend`
  - Expose port 8000
  - Health check: `GET /health` every 30s
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

**Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5)" || exit 1
```

---

## 📊 API ENDPOINTS

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/content/plan` | Generate content plan (script, caption, shot plan) |
| `POST` | `/api/schedule/monthly` | Generate 30-day monthly content schedule |
| `POST` | `/api/weekly/generate` | Generate 7-day weekly schedule |
| `GET` | `/api/holidays` | Get US holidays for content planning |
| `GET` | `/api/dashboard` | Get dashboard statistics |

### Asset & Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assets/search` | Generate AI images or search stock videos |
| `POST` | `/api/assets/search/contextual` | Generate images based on shot plan descriptions |
| `POST` | `/api/assets/regenerate-image` | Regenerate a single image with new prompt |

### Video Rendering Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/video/render` | Start video/image rendering job |
| `GET` | `/api/video/render/{job_id}/status` | Check render job status |

### Social Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/social/schedule` | Schedule post to TikTok/Instagram |

---

## 🔒 SECURITY CONSIDERATIONS

### Environment Variables
- ✅ All secrets stored in environment variables (never in code)
- ✅ `.env` file excluded from Git (via `.gitignore`)
- ✅ Production secrets managed by Coolify
- ✅ No API keys exposed to frontend

### CORS Configuration
- ✅ CORS configured for production domain only
- ✅ `FRONTEND_URL` must match actual domain exactly
- ✅ HTTPS required in production

### File Uploads
- ✅ Images saved to `/static/uploads/` (local storage)
- ✅ File paths validated
- ✅ No arbitrary file execution

### API Security
- ✅ Input validation via Pydantic models
- ✅ Error messages don't expose internal details
- ✅ Rate limiting handled by external APIs

---

## 📈 SCALING CONSIDERATIONS

### Current Architecture (MVP)

**Limitations:**
- SQLite database (single instance only)
- Local file storage (not suitable for load balancing)
- Single container deployment

**Suitable For:**
- Single user or small team
- Low to moderate traffic
- Simple deployment model

### Future Scaling Options

**For High Traffic/Multi-Instance:**

1. **Database Migration:**
   - Migrate from SQLite to PostgreSQL
   - Use connection pooling
   - Enable read replicas if needed

2. **File Storage:**
   - Migrate to object storage (S3, Cloudflare R2, etc.)
   - Use CDN for image delivery
   - Implement signed URLs for security

3. **Caching:**
   - Add Redis for session storage
   - Cache API responses
   - Cache generated content plans

4. **Horizontal Scaling:**
   - Deploy multiple container instances
   - Use load balancer (Coolify supports this)
   - Implement sticky sessions if needed

5. **Background Jobs:**
   - Move video rendering to background queue
   - Use Celery or similar for async tasks
   - Implement job status tracking

---

## 🐛 TROUBLESHOOTING GUIDE

### Common Deployment Issues

**Build Fails:**
- **Dockerfile not found:** Verify `deploy/Dockerfile` exists
- **npm ci fails:** Check `package-lock.json` is committed
- **pip install fails:** Verify Python 3.10+ compatibility

**Health Check Fails:**
- **Timeout:** Check logs for startup errors
- **500 error:** Missing required environment variables
- **Port not exposed:** Verify port 8000 is configured

**Frontend Issues:**
- **Blank page:** `VITE_API_BASE_URL` not set in Build Arguments
- **CORS errors:** `FRONTEND_URL` doesn't match domain
- **API 404:** Backend not running or wrong URL

**Content Generation Fails:**
- **Invalid API key:** Verify Google API key is valid
- **Rate limited:** Check API quotas
- **Model not available:** Verify Gemini 3.0 Pro access

**Video Rendering Fails:**
- **Template ID wrong:** Verify Creatomate template IDs
- **Template format:** Ensure 9:16 aspect ratio
- **API key invalid:** Check Creatomate API key

**Social Scheduling Fails:**
- **Accounts not connected:** Verify TikTok/Instagram in Ayrshare
- **API key invalid:** Check Ayrshare API key
- **Permissions:** Verify account permissions

**Full troubleshooting:** See `docs/TROUBLESHOOTING.md`

---

## 📝 POST-DEPLOYMENT CHECKLIST

### Immediate (First 24 Hours)

- [ ] Monitor health check status (should always be green)
- [ ] Check error logs for any issues
- [ ] Test complete user flow end-to-end
- [ ] Verify all API integrations working
- [ ] Test on different devices/browsers
- [ ] Check resource usage (CPU, memory, disk)

### Short-Term (First Week)

- [ ] Set up automated backups for database
- [ ] Configure monitoring alerts
- [ ] Document any custom workflows
- [ ] Gather user feedback
- [ ] Monitor API usage and costs
- [ ] Review error logs daily

### Long-Term (Ongoing)

- [ ] Regular security updates
- [ ] Performance optimization
- [ ] Feature enhancements based on feedback
- [ ] Plan for scaling if needed
- [ ] Regular database maintenance
- [ ] Monitor external API changes

---

## 📚 DOCUMENTATION REFERENCES

### Deployment Documentation
- **Quick Start:** `docs/DEPLOY_NOW.md` (15-20 min deployment)
- **Detailed Guide:** `docs/COOLIFY_DEPLOYMENT.md` (comprehensive)
- **Checklist:** `docs/COOLIFY_DEPLOYMENT_CHECKLIST.md` (step-by-step)

### Setup Documentation
- **Creatomate:** `docs/creatomate-setup.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Audio System:** `docs/audio-legal-notes.md`

### Project Documentation
- **Main README:** `README.md`
- **Architecture:** `.cursor/rules/02-architecture.mdc`
- **Backend Guidelines:** `.cursor/rules/03-backend-fastapi.mdc`
- **Frontend Guidelines:** `.cursor/rules/04-frontend-react.mdc`

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful when:

✅ Health check returns 200 OK consistently  
✅ Dashboard loads at production domain  
✅ Can generate monthly content plan  
✅ Can generate weekly schedule  
✅ Can create content with AI  
✅ Can generate images (Nano Banana Pro)  
✅ Can render videos/images (Creatomate)  
✅ Can schedule posts to TikTok/Instagram (Ayrshare)  
✅ No errors in browser console  
✅ No errors in server logs  
✅ Persistent storage working (data survives redeployment)  
✅ All API integrations functional  

---

## 🚨 EMERGENCY PROCEDURES

### Rollback Plan

**Quick Rollback (Coolify UI):**
1. Go to Coolify dashboard
2. Click "Rollback" on application
3. Select previous deployment
4. Click "Redeploy"

**Git-Based Rollback:**
1. Revert commit locally
2. Push to repository
3. Coolify auto-deploys (if enabled)

### Database Backup

**Manual Backup:**
```bash
# Backup SQLite database
cp /app/backend/content.db /backup/content.db.$(date +%Y%m%d)
```

**Automated Backup (Recommended):**
- Set up cron job or scheduled task
- Backup to external storage (S3, etc.)
- Test restore procedure regularly

### Monitoring Alerts

**Set Up Alerts For:**
- Health check failures
- High error rates (>5% of requests)
- Resource limits (CPU >80%, Memory >90%)
- API key failures
- Database errors

---

## 📞 SUPPORT RESOURCES

### Internal Documentation
- Deployment guides in `docs/`
- Troubleshooting guide: `docs/TROUBLESHOOTING.md`
- API documentation in code comments

### External Resources
- **Coolify:** https://coolify.io/docs
- **FastAPI:** https://fastapi.tiangolo.com
- **React:** https://react.dev
- **Google Gemini:** https://ai.google.dev
- **Creatomate:** https://creatomate.com/docs
- **Ayrshare:** https://www.ayrshare.com/docs

---

## ✅ FINAL CHECKLIST

Before deploying, verify:

- [ ] All API keys ready and tested
- [ ] Creatomate templates created (image + video)
- [ ] Ayrshare accounts connected (TikTok + Instagram)
- [ ] Domain configured in Coolify
- [ ] Environment variables set (including `VITE_API_BASE_URL` in Build Arguments)
- [ ] Persistent storage configured (2 volumes)
- [ ] Health check settings correct
- [ ] Git branch is `stoic-solomon`
- [ ] All changes committed and pushed
- [ ] Reviewed deployment documentation
- [ ] Backup plan in place
- [ ] Monitoring configured

---

**Ready to Deploy!** 🚀

Start with `docs/DEPLOY_NOW.md` for the quickest path to production.

**Questions?** Review `docs/COOLIFY_DEPLOYMENT.md` for detailed explanations.

---

*Last Updated: December 1, 2024*  
*Document Version: 1.0*

