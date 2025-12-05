# Audio Licensing Verification Checklist

**Status:** ✅ **NOT REQUIRED - USING MUTED MODE**

## Decision: December 4, 2025

**AUDIO_MODE has been set to `MUTED_FOR_PLATFORM_MUSIC`**

The app now renders videos **without background music**. Users add trending TikTok/Instagram sounds manually after export. This approach:
- ✅ Eliminates all audio licensing concerns
- ✅ Allows users to use trending platform-native sounds
- ✅ Provides TikTok music search suggestions via AI
- ✅ Aligns with the "export and add trending music" workflow

**This checklist is preserved for reference only.**

---

## Original Overview (No Longer Applicable)

The app previously used 3 placeholder audio tracks seeded from `backend/app/services/audio_seed.py`. All tracks had **"TODO: VERIFY license and hosting before production use"** in their license notes.

## Current Audio Tracks

### Track 1: Calm Focus Beat
- **File URL:** Currently placeholder
- **Mood:** calm
- **Tempo:** medium
- **Length:** 120 seconds
- **License Type:** CC0
- **License Notes:** ⚠️ TODO: VERIFY

### Track 2: Energetic Motivational
- **File URL:** Currently placeholder
- **Mood:** energetic
- **Tempo:** fast
- **Length:** 90 seconds
- **License Type:** CC0
- **License Notes:** ⚠️ TODO: VERIFY

### Track 3: Inspirational Background
- **File URL:** Currently placeholder
- **Mood:** inspirational
- **Tempo:** medium
- **Length:** 150 seconds
- **License Type:** CC0
- **License Notes:** ⚠️ TODO: VERIFY

---

## ✅ Verification Checklist

Complete this checklist for **each** audio track before production deployment:

### For Each Track:

#### 1. Source Verification
- [ ] Confirm track source (Freesound, YouTube Audio Library, etc.)
- [ ] Verify source is still available
- [ ] Document source URL for reference
- [ ] Save original license page/terms as PDF

#### 2. License Requirements
- [ ] Confirm license is CC0 (public domain) OR
- [ ] Confirm license is royalty-free for commercial use
- [ ] Verify NO attribution requirements (or document if required)
- [ ] Confirm NO geographic restrictions
- [ ] Confirm NO platform restrictions (TikTok/Instagram allowed)
- [ ] Verify license allows commercial product promotion

#### 3. Technical Requirements
- [ ] Audio file is accessible via public HTTPS URL
- [ ] URL is reachable by Creatomate servers
- [ ] File format is compatible (MP3, WAV, AAC)
- [ ] File size is reasonable (< 10MB recommended)
- [ ] Audio quality is suitable for social media

#### 4. Documentation
- [ ] Update `audio_tracks` table with verified URL
- [ ] Update `license_notes` column with full license details
- [ ] Update `source_id` with original track ID/reference
- [ ] Document attribution if required

---

## Recommended CC0 Sources

### Free, Verified CC0 Sources:

1. **Freesound** (https://freesound.org)
   - Filter by "CC0" license
   - Search for "background music", "lofi", "motivational"
   - Verify each track individually

2. **YouTube Audio Library** (https://studio.youtube.com/channel/UC[your-id]/music)
   - Filter by "No attribution required"
   - Download and self-host (don't link to YouTube directly)

3. **Pixabay Music** (https://pixabay.com/music/)
   - All tracks are free for commercial use
   - No attribution required
   - Verify licensing terms haven't changed

4. **Incompetech** (https://incompetech.com)
   - Creative Commons licenses available
   - Some tracks require attribution

### ⚠️ Sources to AVOID:
- ❌ TikTok sound library (scraping violates ToS)
- ❌ Instagram music library (not accessible via API)
- ❌ Spotify/Apple Music (obviously)
- ❌ Epidemic Sound (requires paid subscription)
- ❌ YouTube videos (even if marked "NCS" - needs verification)

---

## Hosting Options

Once you have verified CC0 tracks:

### Option 1: Self-Host (Recommended)
1. Upload files to `/static/audio/` directory
2. Serve via FastAPI static files
3. Use `API_BASE_URL/static/audio/filename.mp3` as file_url
4. Pros: Full control, no external dependencies
5. Cons: Increases Docker image size

### Option 2: Cloud Storage (S3, R2, etc.)
1. Upload to cloud storage bucket
2. Make files publicly accessible (no auth required)
3. Use cloud storage URL as file_url
4. Pros: Doesn't increase image size
5. Cons: External dependency, potential costs

### Option 3: External CDN
1. Use free CDN like jsdelivr or unpkg (for truly CC0 files)
2. Verify CDN allows Creatomate access
3. Use CDN URL as file_url
4. Pros: Fast, reliable
5. Cons: Depends on external service

---

## Database Update Script

After verifying tracks, update the database:

```python
from backend.app.database.database import SessionLocal
from backend.app.database.models import AudioTrack

db = SessionLocal()

# Example update for Track 1
track = db.query(AudioTrack).filter_by(title="Calm Focus Beat").first()
if track:
    track.file_url = "https://yourdomain.com/static/audio/calm-focus.mp3"
    track.source = "freesound_cc0"
    track.source_id = "freesound-123456"
    track.license_notes = "CC0 1.0 Universal. Retrieved from https://freesound.org/people/user/sounds/123456/ on 2025-12-04. No attribution required."
    db.commit()

db.close()
```

---

## Testing After Update

After updating audio tracks:

1. **Test Creatomate Access:**
   ```bash
   curl -I https://yourdomain.com/static/audio/calm-focus.mp3
   # Should return 200 OK with appropriate content-type
   ```

2. **Test Rendering:**
   - Generate a new video via the app
   - Verify audio plays correctly in rendered video
   - Check audio quality and sync

3. **Test Across Platforms:**
   - Upload test video to TikTok
   - Upload test video to Instagram
   - Verify audio isn't flagged/muted

---

## Legal Protection

Consider adding to your Terms of Service / About page:

> "Background music in generated videos is sourced from CC0 (public domain) and royalty-free libraries. Users are responsible for compliance with platform-specific music policies when posting to social media."

---

## Status Updates

### Tasks:
- [ ] Find 3-5 verified CC0 tracks
- [ ] Host tracks (choose hosting option)
- [ ] Update database with verified URLs
- [ ] Test rendering with new tracks
- [ ] Document licenses and sources
- [ ] Update audio_seed.py for future deployments

### Assigned To: _____________
### Due Date: _____________
### Completed Date: _____________

---

## Questions or Issues?

Document any licensing questions or unclear terms here:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

**Last Updated:** December 4, 2025
**Next Review:** Before production deployment
