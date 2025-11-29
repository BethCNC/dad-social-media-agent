# Audio & Music Usage – Legal and Safety Notes

This app is designed to keep Dad's social media videos legally safe while still
using pleasant background music and helping him find good sounds inside TikTok
and Instagram.

## 1. Allowed Music Sources

- Only use **CC0 / royalty-free** or otherwise **properly licensed** tracks:
  - Example sources: Freesound CC0, your own purchased royalty-free library,
    custom tracks you have rights to use.
- All background tracks referenced in the `audio_tracks` table **must** be:
  - Safe for **commercial** use.
  - Cleared for use in social media videos.

Never add:

- Spotify, Apple Music, YouTube, TikTok, or other copyrighted songs unless you
  have an explicit commercial license for that use.

## 2. How the App Uses Music

- Backend selects one `AudioTrack` from the `audio_tracks` table based on
  script mood and `AUDIO_MODE`.
- The selected track's `file_url` is passed to Creatomate as `Music.source`.
- TikTok/Instagram **trending sounds are NOT embedded**:
  - The app only generates **text search phrases** (e.g., `"calm lofi study beat"`).
  - Dad pastes these phrases into TikTok's “Add sound” search bar.

This keeps all TikTok music usage inside TikTok's own UI and terms.

## 3. TikTok Music Hints (Search Phrases)

- Generated hints are **generic descriptive phrases**, not specific tracks:
  - Good: `"relaxing lofi study beat"`, `"energetic motivational reel music"`.
  - Not allowed: specific artists, song titles, or brands.
- The hints are meant to:
  - Help Dad find suitable sounds inside TikTok/IG.
  - Avoid any impression that the app is distributing or bundling TikTok audio.

## 4. Audio Modes

The `AUDIO_MODE` setting controls how background music is used:

- `AUTO_STOCK_ONLY`  
  - Always include a safe background track from `audio_tracks`.
  - No dependency on TikTok sounds.

- `AUTO_STOCK_WITH_TIKTOK_HINTS` (default)  
  - Include a safe background track **and** show TikTok search phrases.
  - Dad can keep the built‑in track or mute it and add a TikTok sound.

- `MUTED_FOR_PLATFORM_MUSIC`  
  - Render videos without a background track.
  - Intended for users who always add platform-native music themselves.

## 5. Developer Responsibilities

When adding or updating audio tracks:

- Verify the license is **commercially safe** (CC0, royalty‑free, or custom).
- Store the license details in `license_type` and `license_notes`.
- Point `file_url` to a location Creatomate can access (e.g., your own S3 or
  Creatomate asset URL).

When adjusting prompts or TikTok hints:

- Never request or output specific copyrighted works.
- Keep hints as **high‑level descriptors** only.

Following these rules keeps the project aligned with TikTok's policies and
general copyright law while giving Dad simple, safe music options.


