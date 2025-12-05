# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Social Media Co-Pilot - an application for creating and scheduling TikTok/Instagram content. Built for non-technical users with a simple wizard interface. Uses AI to generate scripts, captions, custom visuals, and schedule content to social platforms.

**Core Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI (Python 3.10+) + SQLAlchemy + SQLite
- AI: Google Gemini 3.0 Pro (text) + Nano Banana Pro (images)
- Infrastructure: Docker multi-stage build, Coolify deployment

## Development Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build (TypeScript check + Vite build)
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Docker
```bash
# Full stack with docker-compose
docker-compose -f deploy/docker-compose.yml up --build

# Production build (multi-stage)
docker build -f deploy/Dockerfile -t social-copilot .
```

### Database
The app uses SQLite (`content.db` in project root). Database initializes automatically on startup via `init_db()` in `backend/app/main.py:26-29`.

## Architecture & Code Organization

### Monorepo Structure
```
/unicity-agent
  /frontend/             React + Vite app
    src/
      components/        UI components (organized by feature)
      pages/            Page-level components
      lib/              API clients (api.ts, bankApi.ts, etc.)
      hooks/            Custom React hooks
  /backend/             FastAPI app
    app/
      api/v1/           API route handlers (content.py, assets.py, video.py, etc.)
      core/             Config and settings (config.py)
      models/           Pydantic request/response schemas
      services/         Business logic & external API clients
      database/         SQLAlchemy models and repositories
  /static/uploads/      Generated images (created at runtime, served via /static/uploads/)
  /deploy/              Docker files
  /docs/                Additional documentation
```

### Backend Service Architecture

All external API integrations are centralized in `backend/app/services/`:

- **gemini_client.py** - Google Gemini 3.0 Pro for text (scripts, captions, content plans) + Nano Banana Pro for image generation
- **creatomate_client.py** - Video/image rendering from templates
- **ayrshare_client.py** - Social media posting to TikTok/Instagram
- **pexels_client.py** - Stock video search (fallback when AI generation fails)
- **audio_service.py** - Background music selection for videos
- **content_service.py** - Content plan generation orchestration
- **batch_generation_service.py** - Bulk content generation for content bank
- **bank_service.py** - Content bank CRUD operations
- **render_from_bank_service.py** - Rendering videos from bank items with voiceover
- **holiday_service.py** - US holiday sync for content planning
- **dashboard_service.py** - Dashboard metrics and aggregations

Route handlers in `api/v1/` are thin - they validate requests, call services, and return responses. Business logic stays in services.

### Database Models

Key tables (see `backend/app/database/models.py`):

- **ContentBankItem** - Pre-generated scripts/captions for the content bank with render state tracking
- **ScheduledPost** - Individual posts in weekly schedules with shot plans and audio metadata
- **WeeklySchedule** - Generated weekly content schedules (7 posts)
- **AudioTrack** - CC0/royalty-free background music tracks
- **Holiday** - US holidays for content planning
- **UserVideo** - User-uploaded B-roll footage
- **BatchJob** - Batch job tracking for content generation and rendering

### AI Integration

**Content Generation (Gemini 3.0 Pro):**
- Model: `gemini-3-pro-preview`
- Always request JSON output via `response_mime_type="application/json"`
- Supports multimodal input (text + images) via `content=[text, image_part]`
- Used for: scripts, captions, content plans, monthly schedules, shot plans

**Image Generation (Nano Banana Pro):**
- Model: `gemini-3-pro-image-preview`
- Generates images from shot descriptions
- Fallback to Pexels if generation fails
- Images saved to `static/uploads/` and served via `/static/uploads/{filename}`

All Gemini logic is in `backend/app/services/gemini_client.py` (~54k lines - handles prompting, compliance rules, response parsing).

### Audio System

**Current Mode:** `MUTED_FOR_PLATFORM_MUSIC` (set in .env)

Videos render **without background music**. Users add trending TikTok/Instagram sounds manually when posting. The AI generates **TikTok music search suggestions** that users can copy and paste into the platform's music search.

**Three available modes** (configured via `AUDIO_MODE` env var):

- `MUTED_FOR_PLATFORM_MUSIC` - **[CURRENT]** No background music, user adds trending sounds in TikTok/IG
- `AUTO_STOCK_ONLY` - Use built-in free audio track only
- `AUTO_STOCK_WITH_TIKTOK_HINTS` - Include audio + generate TikTok search suggestions

**Why MUTED mode?**
- ✅ No audio licensing concerns
- ✅ Users get trending, viral platform-native sounds
- ✅ AI still provides helpful TikTok music search suggestions
- ✅ Aligns with "export and add trending media" workflow

Track selection happens in `audio_service.pick_track_for_plan()` (returns None in MUTED mode). TikTok music hints generated by Gemini in `gemini_client.py` (always generated regardless of mode).

See `.cursor/rules/audio-system-design.mdc` and `docs/AUDIO_LICENSING_CHECKLIST.md` for detailed documentation.

### Creatomate Templates

The app requires two pre-configured Creatomate templates:

1. **Image Template** (`CREATOMATE_IMAGE_TEMPLATE_ID`) - 9:16 vertical image posts
2. **Video Template** (`CREATOMATE_VIDEO_TEMPLATE_ID`) - 9:16 vertical video posts

Templates use element names like `Background-1`, `Background-2`, `Text-1`, `Text-2`, etc.

See `docs/creatomate-setup.md` for setup instructions.

### Frontend API Layer

Base Axios instance in `frontend/src/lib/api.ts`:
- Base URL from `VITE_API_BASE_URL` env var
- 120s timeout (content generation can be slow)
- Error interceptors for logging

Specialized API modules:
- `lib/bankApi.ts` - Content bank operations
- Individual page components handle their own API calls

## Environment Variables

### Required (Backend)
```bash
GOOGLE_API_KEY              # Google AI Studio/Vertex AI for Gemini
CREATOMATE_API_KEY          # Video rendering
CREATOMATE_IMAGE_TEMPLATE_ID
CREATOMATE_VIDEO_TEMPLATE_ID
AYRSHARE_API_KEY           # Social posting
API_BASE_URL               # For constructing public image URLs (e.g., https://social.yourdomain.com)
```

### Optional (Backend)
```bash
FRONTEND_URL               # Default: http://localhost:5173
ENV                        # Default: development (or production)
PORT                       # Default: 8000
LOG_LEVEL                  # Default: INFO
AUDIO_MODE                 # Current: MUTED_FOR_PLATFORM_MUSIC (videos render without background music)
APIFY_API_TOKEN           # Optional: For trend surveillance
TTS_API_URL               # Optional: External TTS endpoint
TTS_API_KEY               # Optional: TTS API key
TTS_VOICE_ID              # Optional: Voice identifier
CREATOMATE_DEFAULT_MUSIC  # Optional: Default background music URL
```

### Frontend
```bash
VITE_API_BASE_URL         # Default: http://localhost:8000
```

## Key API Endpoints

```
GET  /health                                    Health check with external API connectivity
POST /api/content/plan                          Generate content plan (supports multipart/form-data with image)
POST /api/schedule/monthly                      Generate 30-day content schedule
POST /api/weekly/generate                       Generate 7-post weekly schedule
GET  /api/assets/search                         Generate AI images or search stock videos
POST /api/assets/search/contextual              Generate images from shot plan descriptions
POST /api/assets/regenerate-image               Regenerate single image
POST /api/video/render                          Start video/image render
GET  /api/video/render/{job_id}/status          Check render status
POST /api/social/schedule                       Schedule social post
POST /api/bank/generate-batch                   Batch generate content bank items
GET  /api/bank/items                            List content bank items
POST /api/bank/items/{id}/render                Render video from bank item with voiceover
POST /api/bank/items/{id}/generate-voiceover    Generate voiceover for bank item
```

## Important Patterns & Conventions

### Pydantic Models
All request/response schemas use Pydantic models in `backend/app/models/`. Core examples:

- `ContentBrief` - User input for content generation
- `GeneratedPlan` - AI-generated content plan with script, caption, shot plan
- `ShotInstruction` - Individual shot with description and duration
- `VideoRenderRequest` - Video render request with assets and script
- `ContentBankItemCreate` - Creating content bank items

### Error Handling
Services catch third-party API errors and raise FastAPI `HTTPException` with clear messages. Never log secrets or full external API responses.

### CORS Configuration
Backend CORS allows `FRONTEND_URL` in production, `*` in development (see `backend/app/main.py:66-72`).

Static file serving includes CORS headers via custom `StaticFilesWithCORS` middleware for image access from external domains (e.g., ngrok).

### Image URLs
Generated images are saved locally to `static/uploads/` and served at `/static/uploads/{filename}`. The `API_BASE_URL` env var constructs full public URLs that Creatomate can access for rendering.

### Creation-First Workflow
The app generates images via AI (Nano Banana Pro) automatically from shot descriptions. If generation fails, it falls back to Pexels search. Users can regenerate individual images with one click.

## Testing

No test suite currently exists. When adding tests:
- Backend: Use pytest with FastAPI test client
- Frontend: Use Vitest (already in package.json dev dependencies)

## Deployment

### Coolify Setup
1. Create app using Dockerfile at `deploy/Dockerfile`
2. Set all required environment variables
3. Configure health check: `GET /health` every 30s
4. App serves on port 8000

The Docker build:
- Stage 1: Node builds React frontend
- Stage 2: Python runs FastAPI + serves static frontend
- Single container, all routes handled by FastAPI

## Compliance & Content Rules

The app includes Unicity product compliance rules embedded in `gemini_client.py` prompts. Key constraints:
- No health claims beyond approved marketing language
- Product integration follows specific playbook patterns
- Content follows TikTok best practices from `.cursor/rules/tiktok-playbook.mdc`

See `.cursor/rules/06-openai-prompting.mdc` for detailed AI prompting guidelines.

## Additional Documentation

- `.cursor/rules/prd.mdc` - Product requirements
- `.cursor/rules/tiktok-playbook.mdc` - TikTok content strategy
- `.cursor/rules/audio-system-design.mdc` - Audio system architecture
- `docs/creatomate-setup.md` - Creatomate template setup
