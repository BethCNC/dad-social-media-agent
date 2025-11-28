# AI Social Media Co-Pilot

An AI-powered application that helps create and schedule TikTok and Instagram content. Designed for older, non-technical users with a simple, step-by-step wizard interface.

## Features

- **Monthly Content Schedule**: Generate 30 days of content ideas following TikTok playbook best practices
- **AI Content Generation**: Generate scripts and captions using OpenAI GPT-4o with Unicity compliance rules
- **Stock Video Search**: Find and select video clips from Pexels
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

### Infrastructure
- Docker (multi-stage build)
- Coolify deployment ready

## Environment Variables

The following environment variables are required:

```bash
# API Keys
OPENAI_API_KEY=your_openai_api_key
PEXELS_API_KEY=your_pexels_api_key
CREATOMATE_API_KEY=your_creatomate_api_key
CREATOMATE_IMAGE_TEMPLATE_ID=your_image_template_id_here
CREATOMATE_VIDEO_TEMPLATE_ID=your_video_template_id_here
AYRSHARE_API_KEY=your_ayrshare_api_key

# Application Settings
FRONTEND_URL=http://localhost:5173  # For development
ENV=development  # or production
PORT=8000  # Optional, defaults to 8000
LOG_LEVEL=INFO  # Optional, defaults to INFO
```

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
   - `OPENAI_API_KEY`
   - `PEXELS_API_KEY`
   - `CREATOMATE_API_KEY`
   - `CREATOMATE_IMAGE_TEMPLATE_ID` (your Creatomate image template ID)
   - `CREATOMATE_VIDEO_TEMPLATE_ID` (your Creatomate video template ID)
   - `AYRSHARE_API_KEY`
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

## Project Structure

```
/ai-social-copilot
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
      services/      # Business logic & API clients
  /deploy            # Docker files
    Dockerfile
    docker-compose.yml
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/content/plan` - Generate content plan
- `POST /api/schedule/monthly` - Generate monthly content schedule (30 days)
- `GET /api/assets/search` - Search stock videos
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
