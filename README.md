# AI Social Media Co-Pilot

An AI-powered application that helps create and schedule TikTok and Instagram content. Designed for older, non-technical users with a simple, step-by-step wizard interface.

## Features

- **AI Content Generation**: Generate scripts and captions using OpenAI GPT-4o
- **Stock Video Search**: Find and select video clips from Pexels
- **Video Rendering**: Assemble videos using Creatomate
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
AYRSHARE_API_KEY=your_ayrshare_api_key

# Application Settings
FRONTEND_URL=http://localhost:5173  # For development
ENV=development  # or production
```

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
   - `AYRSHARE_API_KEY`
   - `ENV=production`
   - `FRONTEND_URL` (your production URL)

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
- `GET /api/assets/search` - Search stock videos
- `POST /api/video/render` - Start video rendering
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
