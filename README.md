# AI Social Media Co-Pilot

An AI-powered application that helps create and schedule TikTok and Instagram content. Designed for older, non-technical users with a simple, step-by-step wizard interface.

## Features

- **Monthly Content Schedule**: Generate 30 days of content ideas following TikTok playbook best practices
- **AI Content Generation**: Generate scripts and captions using Google Gemini 3.0 Pro with Unicity compliance rules
- **AI Image Generation**: Create custom visuals using Nano Banana Pro (Gemini 3.0 Pro Image) based on shot descriptions
- **Multimodal Input**: Upload inspiration images to guide script generation
- **Creation-First Workflow**: AI generates images automatically from shot plans, with Pexels fallback if needed
- **Image Regeneration**: Regenerate individual images with a single click
- **Video/Image Rendering**: Assemble videos or images using Creatomate templates
- **Social Scheduling**: Schedule posts to TikTok and Instagram via Ayrshare

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Axios (HTTP client)

### Backend
- FastAPI (Python 3.10+)
- Pydantic (data validation)
- httpx (HTTP client)
- Google GenAI SDK (Gemini 3.0 Pro and Nano Banana Pro)
- Pillow (image processing)

### Infrastructure
- Docker (multi-stage build)
- Coolify deployment ready

## Environment Variables

The following environment variables are required:

```bash
# API Keys
GOOGLE_API_KEY=your_google_api_key  # For Gemini 3.0 Pro and Nano Banana Pro
CREATOMATE_API_KEY=your_creatomate_api_key
CREATOMATE_IMAGE_TEMPLATE_ID=your_image_template_id_here
CREATOMATE_VIDEO_TEMPLATE_ID=your_video_template_id_here
AYRSHARE_API_KEY=your_ayrshare_api_key

# Application Settings
FRONTEND_URL=http://localhost:5173  # For development
API_BASE_URL=http://localhost:8000  # For constructing public image URLs (defaults to http://localhost:8000)
ENV=development  # or production
PORT=8000  # Optional, defaults to 8000
LOG_LEVEL=INFO  # Optional, defaults to INFO
AUDIO_MODE=AUTO_STOCK_WITH_TIKTOK_HINTS  # Optional: AUTO_STOCK_ONLY, AUTO_STOCK_WITH_TIKTOK_HINTS, or MUTED_FOR_PLATFORM_MUSIC
```

**Note:** Generated images are saved to `static/uploads/` and served at `/static/uploads/{filename}`. The `API_BASE_URL` is used to construct full public URLs that Creatomate can access.

### Creatomate Template Setup

Before using the app, you need to create both an image and video template in Creatomate. See [docs/creatomate-setup.md](docs/creatomate-setup.md) for detailed instructions.

**Quick Setup:**
1. Create a vertical 9:16 (1080x1920) video template in Creatomate
2. Create a vertical 9:16 (1080x1920) image template in Creatomate
3. Both templates should use element names like `Background-1`, `Background-2`, `Text-1`, `Text-2`, etc.
4. Copy your template IDs and add them to `CREATOMATE_IMAGE_TEMPLATE_ID` and `CREATOMATE_VIDEO_TEMPLATE_ID` in your `.env` file
5. Users can choose between image or video when creating content

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.10+
- Docker (optional, for containerized development)

### Running Locally

#### Option 1: Separate Frontend and Backend

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

#### Option 2: Docker Compose

```bash
# Create .env file with required variables
cp .env.example .env
# Edit .env with your API keys

# Create frontend .env file
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed (defaults should work for local dev)

# Run with docker-compose
docker-compose -f deploy/docker-compose.yml up --build
```

## Deployment

### Coolify Setup

1. **Create a new app** in Coolify using the Dockerfile from `deploy/Dockerfile`

2. **Set environment variables** in Coolify UI:
   - `GOOGLE_API_KEY` (for Gemini 3.0 Pro and Nano Banana Pro - get from Google AI Studio or Vertex AI)
   - `CREATOMATE_API_KEY`
   - `CREATOMATE_IMAGE_TEMPLATE_ID` (your Creatomate image template ID)
   - `CREATOMATE_VIDEO_TEMPLATE_ID` (your Creatomate video template ID)
   - `AYRSHARE_API_KEY`
   - `API_BASE_URL` (your production URL, e.g., `https://social.yourdomain.com` - required for image URLs)
   - `AUDIO_MODE` (optional: `AUTO_STOCK_ONLY`, `AUTO_STOCK_WITH_TIKTOK_HINTS`, or `MUTED_FOR_PLATFORM_MUSIC`)
   - `ENV=production`
   - `FRONTEND_URL` (your production URL)
   - `PORT=8000` (optional)
   - `LOG_LEVEL=INFO` (optional)

3. **Configure health check**:
   - Endpoint: `GET /health`
   - Interval: 30s

4. **Build and deploy**:
   - Coolify will automatically build using the Dockerfile
   - The app will be available on port 8000

## How It Works

### Content Generation Flow

1. **Idea Input**: User enters a topic or uploads an inspiration image
2. **Script Generation**: Gemini 3.0 Pro generates a script, caption, and shot plan based on the input
3. **Image Generation**: Nano Banana Pro automatically generates images for each shot description
4. **Selection**: User selects the generated images (or can regenerate individual ones)
5. **Rendering**: Creatomate assembles the final video/image using the selected assets and script
6. **Scheduling**: Content can be scheduled to TikTok and Instagram via Ayrshare

### Creation-First Workflow

The app uses a **creation-first** approach:
- Images are generated by AI based on shot descriptions from the content plan
- If generation fails, the app automatically falls back to Pexels search
- Users can regenerate individual images with a single click
- All generated images are saved locally and served via `/static/uploads/`

## Project Structure

```
/unicity-agent
  /frontend          # React + Vite app
    src/
      components/    # React components
      pages/         # Page components
      lib/           # API clients
  /backend           # FastAPI app
    app/
      api/v1/        # API routes
      core/          # Configuration
      models/        # Pydantic models
      services/      # Business logic & API clients (gemini_client.py, creatomate_client.py, etc.)
      database/      # Database models and repositories
  /static            # Generated images (created at runtime)
    uploads/         # AI-generated images stored here
  /deploy            # Docker files
    Dockerfile
    docker-compose.yml
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/content/plan` - Generate content plan (supports optional image upload for multimodal input)
  - Accepts `multipart/form-data` with `brief_json` and optional `image` file
- `POST /api/schedule/monthly` - Generate monthly content schedule (30 days)
- `POST /api/weekly/generate` - Generate weekly schedule (7 posts)
- `GET /api/assets/search` - Generate AI images or search stock videos (backward compatible)
- `POST /api/assets/search/contextual` - Generate images based on shot plan descriptions
- `POST /api/assets/regenerate-image` - Regenerate a single image with a new prompt
- `POST /api/video/render` - Start video/image rendering
- `GET /api/video/render/{job_id}/status` - Check render status
- `POST /api/social/schedule` - Schedule social media post

## Health Check

The application exposes a health check endpoint at `/health` that returns:
```json
{
  "status": "ok"
}
```

This endpoint is used by Coolify for health monitoring.

## License

MIT
