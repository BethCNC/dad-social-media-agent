# Troubleshooting Guide - Content Generation Issues

## Fixed Issues

### ✅ Missing base64 Import (Fixed)
**Problem:** Image generation was failing with `NameError: name 'base64' is not defined`
**Location:** `backend/app/services/gemini_client.py` line 369
**Fix:** Added `import base64` at the top of the file
**Status:** ✅ Fixed

## Common Issues to Check

### 1. API Keys Not Configured

Check if your `.env` file has all required API keys:

```bash
cd /Users/bethcartrette/REPOS/unicity-agent
cat .env | grep -E "(GOOGLE_API_KEY|CREATOMATE_API_KEY|AYRSHARE_API_KEY)"
```

**Required Keys:**
- `GOOGLE_API_KEY` - For Gemini 3.0 Pro content generation and Imagen 4.0 image generation
- `CREATOMATE_API_KEY` - For video rendering
- `CREATOMATE_IMAGE_TEMPLATE_ID` - For image template rendering
- `CREATOMATE_VIDEO_TEMPLATE_ID` - For video template rendering
- `AYRSHARE_API_KEY` - For social media posting

### 2. Backend Not Running

Check if the backend server is running:

```bash
# Check if backend is running on port 8000
curl http://localhost:8000/health
```

**To start backend:**
```bash
cd backend
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Not Connected to Backend

Check `frontend/.env` or `frontend/src/lib/*Api.ts` files to ensure API base URL is correct:

```bash
# Should point to http://localhost:8000 in development
grep -r "VITE_API_BASE_URL\|localhost:8000" frontend/src
```

### 4. Database Not Initialized

The database should auto-initialize on first run, but you can check:

```bash
cd backend
python3 -c "from app.database.database import init_db; init_db(); print('DB initialized')"
```

### 5. Client Profile Missing

The client profile JSON file must exist:

```bash
ls -la backend/app/core/client_unicity_profile.json
```

If missing, create it with the required structure (see PRD for details).

### 6. Gemini API Errors

Common Gemini API errors:

- **401 Unauthorized**: Check `GOOGLE_API_KEY` is valid
- **403 Permission Denied**: API key may not have access to Gemini 3.0 Pro or Imagen 4.0
- **429 Rate Limited**: Too many requests - wait and retry
- **500 Server Error**: Google's API is down - check status page

**Check logs:**
```bash
# View backend logs when running
# Look for "Gemini API error" messages
```

### 7. Image Generation Issues

**Model name check:**
- Current: `imagen-4.0-fast-generate-001`
- Verify this model name is available in your Google Cloud project

**Check image upload directory:**
```bash
ls -la static/uploads/
# Directory should exist and be writable
```

### 8. Content Generation Pipeline Flow

The flow should be:
1. **Step 1 (Brief)**: User enters topic → `/api/content/plan` → Gemini generates script/caption/shot_plan
2. **Step 2 (Assets)**: Shot plan → `/api/assets/search/contextual` → Images generated for each shot
3. **Step 3 (Render)**: Selected assets → `/api/video/render` → Creatomate renders video
4. **Step 4 (Schedule)**: Rendered video → `/api/social/schedule` → Ayrshare posts

**Debug each step:**
```bash
# Test content generation
curl -X POST http://localhost:8000/api/content/plan \
  -F 'brief_json={"user_topic":"3 tips for energy","platforms":["TikTok"],"tone":"friendly","mode":"manual"}' \
  -v

# Test asset search
curl -X POST http://localhost:8000/api/assets/search/contextual \
  -H "Content-Type: application/json" \
  -d '{"topic":"energy tips","hook":"test","script":"test","shot_plan":[{"description":"coffee cup morning","duration_seconds":5}],"content_pillar":"education","visual_style":"ai_generation"}' \
  -v
```

### 9. Browser Console Errors

Check browser console (F12) for frontend errors:
- Network errors (CORS, 404, 500)
- JavaScript errors
- API call failures

### 10. CORS Issues

If you see CORS errors, check `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],  # Should include http://localhost:5173
    ...
)
```

## Testing Checklist

- [ ] Backend server is running on port 8000
- [ ] Frontend is running and can reach backend
- [ ] `.env` file has all required API keys
- [ ] Health check endpoint works: `GET /health`
- [ ] Content generation endpoint works: `POST /api/content/plan`
- [ ] Asset search endpoint works: `POST /api/assets/search/contextual`
- [ ] Image generation works: Check browser network tab when generating assets
- [ ] Video rendering works: Check Creatomate API key and template IDs
- [ ] Database is initialized and accessible

## Debug Mode

Enable debug logging in `.env`:
```bash
LOG_LEVEL=DEBUG
```

Then check backend logs for detailed error messages.

## Getting Help

If issues persist:
1. Check backend logs for specific error messages
2. Check browser console for frontend errors
3. Test API endpoints directly with curl/Postman
4. Verify all API keys are valid and have proper permissions
5. Check Google Cloud console for API quota/limits

