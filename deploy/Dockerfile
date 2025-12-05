# Multi-stage Docker build for AI Social Media Co-Pilot
# Optimized for Coolify deployment

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (use ci for faster, reproducible builds)
# Note: We need ALL dependencies including devDependencies for the build
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build argument for API URL (will be baked into the frontend build)
# Coolify passes API_BASE_URL, so we use that to set VITE_API_BASE_URL
ARG API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${API_BASE_URL}

# Build frontend (production mode)
RUN npm run build

# Verify build output exists
RUN ls -la /app/frontend/dist

# Stage 2: Python runtime
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./static

# Create necessary directories with proper permissions
RUN mkdir -p /app/static/uploads /app/static/audio && \
    chmod -R 755 /app/static

# Create a non-root user for security (optional but recommended)
# RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
# USER appuser

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Health check (using curl for better reliability)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run uvicorn with production settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

