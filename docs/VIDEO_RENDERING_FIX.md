# Video Rendering Failure - Debugging Guide

## Common Issues at Step 5 (Video Rendering)

### Issue 1: Image URLs Point to Localhost (Most Common)

**Problem:** Creatomate cannot access `localhost` URLs. If your `API_BASE_URL` is set to `http://localhost:8000`, the generated images will be inaccessible to Creatomate's servers.

**Solution:**
1. **Option A: Use ngrok (Quick Fix for Development)**
   ```bash
   # Install ngrok: brew install ngrok (macOS) or download from ngrok.com
   ngrok http 8000
   # Copy the https URL (e.g., https://abc123.ngrok.io)
   # Add to .env: API_BASE_URL=https://abc123.ngrok.io
   ```

2. **Option B: Deploy to Production**
   - Deploy your backend to a publicly accessible URL
   - Set `API_BASE_URL` to your production URL

3. **Option C: For Testing - Use Pexels Videos Instead**
   - Switch to "Stock Video" mode in the wizard
   - Pexels videos are publicly hosted, so Creatomate can access them

### Issue 2: Template IDs Incorrect

**Check:** Verify your template IDs in `.env`:
```bash
CREATOMATE_VIDEO_TEMPLATE_ID=your-template-id
CREATOMATE_IMAGE_TEMPLATE_ID=your-template-id
```

**To find template IDs:**
1. Go to Creatomate dashboard
2. Open your template
3. Check the URL or template settings for the ID

### Issue 3: Template Element Names Don't Match

**Check:** Your Creatomate template must have elements named exactly:
- For video templates: `Background-1`, `Background-2`, `Text-1`, `Text-2`, `Music`
- For image templates: `Image`, `Text`

**To verify:**
1. Open template in Creatomate editor
2. Select each element
3. Check the "Name" field matches exactly

### Issue 4: API Key Invalid

**Check:** Your Creatomate API key in `.env`:
```bash
CREATOMATE_API_KEY=your-api-key
```

**To get API key:**
1. Go to Creatomate dashboard → Settings → API
2. Copy your API key

## How to Debug

1. **Check Backend Logs:**
   ```bash
   tail -f /tmp/backend.log | grep -E "Creatomate|Rendering|ERROR|❌"
   ```

2. **Check What URLs Are Being Sent:**
   Look for log lines like:
   ```
   🎬 Rendering video template with ID: ...
   Asset URLs: [http://...]
   ```

3. **Check Creatomate Status:**
   The logs will show:
   - `✅ Creatomate API response received` = API call succeeded
   - `❌ Creatomate returned error` = Render failed (check error message)
   - `📊 Render status check: status=failed` = Check why it failed

4. **Test API Directly:**
   ```bash
   curl -X GET "https://api.creatomate.com/v2/renders/YOUR_JOB_ID" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## Quick Fix for Local Development

Since Creatomate needs publicly accessible URLs, the easiest solution is:

1. **Use Stock Videos (Pexels)** instead of AI-generated images for testing:
   - In the wizard, switch to "Stock Video" tab
   - These videos are already publicly hosted

2. **Or use ngrok** to expose your localhost:
   ```bash
   ngrok http 8000
   # Then add to .env:
   API_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

## Expected Error Messages

After the fix, you'll see specific error messages like:
- "Asset URL points to localhost: ... Creatomate cannot access localhost URLs"
- "Invalid Creatomate API key"
- "Template not found"
- Specific Creatomate API error messages

