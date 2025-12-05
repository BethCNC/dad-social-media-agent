# Audio System Decision - December 4, 2025

## Decision Summary

**AUDIO_MODE has been set to: `MUTED_FOR_PLATFORM_MUSIC`**

Videos now render **without background music**. Users add trending TikTok/Instagram sounds manually when posting.

---

## Why This Approach?

Based on your workflow where users "export and find trending media":

✅ **No audio licensing concerns** - No need to verify CC0 tracks
✅ **Trending sounds perform better** - Platform-native audio favored by algorithms
✅ **Zero maintenance** - No audio library to manage or update
✅ **AI still helps** - Generates TikTok music search suggestions for users
✅ **User control** - Users choose exactly which trending sound to use

---

## How It Works

1. **Content Generation**
   - AI (Gemini) generates script, caption, shot plan
   - AI also generates 2-5 TikTok music search suggestions
   - Example: "upbeat motivational background music", "calm lofi study beat"

2. **Video Rendering**
   - Video renders with NO background music
   - Only voiceover (if TTS is configured) or silent visuals
   - Clean slate for platform music

3. **User Workflow**
   - Export/download video from app
   - Upload to TikTok/Instagram
   - Tap "Add sound" in platform editor
   - Copy/paste AI-suggested search phrase
   - Choose trending sound from results
   - Post!

---

## What Changed

### Files Modified:
- `.env` - Added `AUDIO_MODE=MUTED_FOR_PLATFORM_MUSIC`
- `CLAUDE.md` - Updated audio system documentation
- `docs/AUDIO_LICENSING_CHECKLIST.md` - Marked as not required
- `docs/KNOWN_ISSUES.md` - Documented decision
- `FIXES_APPLIED.md` - Removed audio licensing from production blockers

### Code Behavior:
- `audio_service.pick_track_for_plan()` now returns `None` (no background track)
- `gemini_client.py` still generates `tiktok_music_hints` (this is independent of AUDIO_MODE)
- Creatomate renders videos without background audio track

---

## TikTok Music Hints Still Work!

**Important:** Even in MUTED mode, the AI still generates helpful TikTok music search suggestions.

The content plan will include:
```json
{
  "script": "...",
  "caption": "...",
  "music_mood": "energetic",
  "tiktok_music_hints": [
    {
      "label": "Upbeat motivational",
      "searchPhrase": "upbeat motivational background music",
      "mood": "energetic"
    },
    {
      "label": "Energetic workout",
      "searchPhrase": "energetic fitness reel music",
      "mood": "energetic"
    }
  ]
}
```

Users can copy these search phrases directly into TikTok's music search.

---

## Alternative Modes (If You Change Your Mind)

The system supports three modes - you can switch anytime by changing `AUDIO_MODE` in `.env`:

### `MUTED_FOR_PLATFORM_MUSIC` [CURRENT]
- No background music in rendered videos
- Users add platform music themselves
- TikTok hints still generated

### `AUTO_STOCK_WITH_TIKTOK_HINTS`
- Renders with CC0 background music
- Also generates TikTok hints
- **Requires:** Complete audio licensing checklist

### `AUTO_STOCK_ONLY`
- Renders with CC0 background music only
- No TikTok hints generated
- **Requires:** Complete audio licensing checklist

---

## Production Status

**✅ READY FOR PRODUCTION**

- ✅ No audio licensing verification needed
- ✅ No production blockers related to audio
- ✅ TikTok music hints system verified working
- ✅ Documentation updated

---

## Questions & Answers

**Q: What if users want background music in auto-scheduled posts?**
A: Switch to `AUTO_STOCK_WITH_TIKTOK_HINTS` mode and complete the audio licensing checklist. This adds safe CC0 music to all videos.

**Q: Can users still use voiceover/TTS?**
A: Yes! Voiceover is separate from background music. Configure TTS_API_URL, TTS_API_KEY, and TTS_VOICE_ID to enable voiceover generation.

**Q: Will videos be completely silent?**
A: If TTS is configured, videos will have voiceover narration. Otherwise, yes - silent until user adds platform music.

**Q: How do users see the TikTok music hints?**
A: The hints should be displayed in the UI (wizard final step or post details page). Frontend implementation may need verification.

---

## Related Documentation

- `CLAUDE.md` - Full project documentation
- `.cursor/rules/audio-system-design.mdc` - Original audio system design spec
- `docs/AUDIO_LICENSING_CHECKLIST.md` - Audio licensing guide (preserved for reference)
- `backend/app/services/audio_service.py` - Audio track selection logic
- `backend/app/models/audio.py` - AudioMode enum definition

---

**Last Updated:** December 4, 2025
**Decision By:** Beth (user)
**Implemented By:** Claude Code
