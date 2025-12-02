# Production Deployment Checklist
## AI Social Media Co-Pilot - Bank-First + Headless Video Pipeline

This checklist ensures your app is production-ready with the new bank-first architecture and headless video rendering pipeline.

---

## Pre-Deployment: Environment Variables

### Required API Keys

```bash
# Google Gemini (for content generation)
GOOGLE_API_KEY=your_google_api_key_here

# Creatomate (for video rendering)
CREATOMATE_API_KEY=your_creatomate_api_key
CREATOMATE_IMAGE_TEMPLATE_ID=6078ebc7-bf39-479f-95ee-f36d963112d5  # Your image+VO template
CREATOMATE_VIDEO_TEMPLATE_ID=your_video_template_id  # Optional: if you have a video template

# TTS Provider (for voiceover generation)
TTS_API_URL=https://your-tts-provider.com/api/generate  # Your TTS endpoint
TTS_API_KEY=your_tts_api_key  # If required
TTS_VOICE_ID=your_voice_id  # Optional: provider-specific voice

# Pexels (for stock video assets)
PEXELS_API_KEY=your_pexels_api_key

# Ayrshare (optional: for social scheduling)
AYRSHARE_API_KEY=your_ayrshare_api_key

# Production URLs
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com
ENV=production
PORT=8000
LOG_LEVEL=INFO
```

### Build Arguments (Coolify)

In Coolify's **Build Arguments** section (separate from Environment Variables):

```bash
VITE_API_BASE_URL=https://your-domain.com
```

---

## Database Migration

The new schema includes extended `ContentBankItem` and `BatchJob` tables. The app will auto-create these on first startup, but verify:

1. **Check database file exists**: `/app/backend/content.db` (or your configured path)
2. **Verify tables created**: On first startup, check logs for table creation
3. **Backup existing data**: If upgrading, backup your `content.db` file before deployment

---

## Creatomate Template Verification

### Image Template (Primary)

Your template ID: `6078ebc7-bf39-479f-95ee-f36d963112d5`

**Required elements:**
- `Image` (image element) - mapped to `Image.source`
- `Text` (text element) - mapped to `Text.text`
- `Voiceover` (audio element) - mapped to `Voiceover.source`

**Verify in Creatomate dashboard:**
1. Open template editor
2. Confirm element names match exactly: `Image`, `Text`, `Voiceover`
3. Test render with sample data:
   ```json
   {
     "Image.source": "https://example.com/image.jpg",
     "Text.text": "Test script",
     "Voiceover.source": "https://example.com/voiceover.mp3"
   }
   ```

### Video Template (Optional)

If you have a video template, ensure:
- `Background-1`, `Background-2` (video elements)
- `Text-1`, `Text-2` (text elements)
- `Voiceover` (audio element)
- `Music` (optional audio element)

---

## TTS Provider Configuration

### Option 1: ElevenLabs (Recommended)

If using ElevenLabs:

```bash
TTS_API_URL=https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
TTS_API_KEY=your_elevenlabs_api_key
TTS_VOICE_ID=your_voice_id
```

**Expected response format:**
```json
{
  "audio_url": "https://api.elevenlabs.io/v1/text-to-speech/..."
}
```

### Option 2: Custom TTS Endpoint

Your TTS endpoint must:
- Accept POST with JSON: `{"text": "...", "voice_id": "..."}`
- Return JSON: `{"audio_url": "https://..."}`
- Be publicly accessible (Creatomate needs to download the MP3)

---

## Production Testing Workflow

### 1. Health Check

```bash
curl https://your-domain.com/health
```

Expected:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "external_apis": {
    "creatomate": "reachable",
    "pexels": "reachable"
  }
}
```

### 2. Test Batch Content Generation

```bash
curl -X POST https://your-domain.com/api/content/bank/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic_theme": "afternoon energy",
    "content_pillars": ["education", "routine"],
    "tone": "friendly",
    "count": 3,
    "topic_cluster": "afternoon_energy"
  }'
```

Expected: Returns a `BatchJob` with `status: "succeeded"` and `created_item_ids` in payload.

### 3. Test Voiceover Generation

```bash
# First, approve a bank item (via admin UI or API)
curl -X PATCH https://your-domain.com/api/content/bank/{item_id} \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'

# Then generate voiceover
curl -X POST https://your-domain.com/api/content/bank/{item_id}/voiceover
```

Expected: Returns updated `BankItem` with `voiceover_url` populated.

### 4. Test Render from Bank

```bash
curl -X POST https://your-domain.com/api/video/render-from-bank/{item_id}?template_type=video
```

Expected: Returns `RenderJob` with `status: "succeeded"` and `video_url`.

### 5. End-to-End Test

1. Generate batch content (step 2)
2. Approve one item
3. Generate voiceover (step 3)
4. Render video (step 4)
5. Verify video URL is accessible and plays correctly

---

## Worker Script Setup (Optional)

For batch rendering, you can run the worker script:

```bash
# One-time job processing (for cron)
python scripts/process_render_queue.py --once

# Process specific job
python scripts/process_render_queue.py --job-id 123

# Continuous worker (long-running)
python scripts/process_render_queue.py
```

**For production, consider:**
- Running worker as a systemd service
- Or using Coolify's background job feature
- Or triggering via cron every 5 minutes

---

## Monitoring & Observability

### Logs to Watch

1. **Batch generation logs**: Look for "Generated bank item" messages
2. **Voiceover generation**: Check for TTS API errors
3. **Render status**: Monitor `last_render_status` in bank items
4. **Duplicate detection**: Watch for "Near-duplicate detected" warnings

### Key Metrics

- **Content bank size**: Total approved items
- **Render success rate**: `succeeded` vs `failed` in `last_render_status`
- **Voiceover generation rate**: Items with `voiceover_url` vs total approved
- **Usage distribution**: Items with `times_used > 0` vs unused

---

## Common Production Issues

### Issue: TTS API returns 401/403

**Solution**: Check `TTS_API_KEY` is set correctly and has valid permissions.

### Issue: Creatomate render fails with "template not found"

**Solution**: Verify `CREATOMATE_IMAGE_TEMPLATE_ID` matches your template ID exactly.

### Issue: Voiceover URL not accessible to Creatomate

**Solution**: Ensure TTS provider returns a publicly accessible URL (not localhost or private IP).

### Issue: Batch generation creates duplicates

**Solution**: Adjust `similarity_threshold` in batch generation request (default 0.4). Lower = stricter.

### Issue: No visuals found for bank items

**Solution**: Check Pexels API key and verify search queries are generating results.

---

## Post-Deployment Verification

After deployment, verify:

- [ ] Health check returns `healthy` status
- [ ] Can generate batch content (creates draft items)
- [ ] Can approve items (status changes to `approved`)
- [ ] Can generate voiceover (voiceover_url populated)
- [ ] Can render video (rendered_video_url populated)
- [ ] Rendered video URL is accessible and plays
- [ ] Admin UI shows all statuses and actions work
- [ ] User view (non-admin) only shows approved items
- [ ] Non-repeating selection works (prioritize_unused)

---

## Rollback Plan

If issues occur:

1. **Database rollback**: Restore `content.db` from backup
2. **Code rollback**: Revert to previous Git commit in Coolify
3. **Environment rollback**: Restore previous `.env` values

---

## Next Steps After Deployment

1. **Populate initial bank**: Run batch generation for 20-30 items across all pillars
2. **Review and approve**: Use admin UI to review drafts and approve quality content
3. **Generate voiceovers**: Batch generate VOs for approved items
4. **Test daily workflow**: Have your dad use the bank to create one video end-to-end
5. **Monitor and iterate**: Watch usage patterns and adjust batch generation parameters

---

**Status**: Ready for production deployment once environment variables are configured and Creatomate templates are verified.

