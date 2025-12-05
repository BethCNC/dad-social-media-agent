# Known Issues

This document tracks known issues and technical debt in the AI Social Media Co-Pilot application.

## Critical Issues

### 1. Dashboard Briefing Returns Hardcoded Data

**Status:** 🔴 Critical
**File:** `backend/app/api/v1/dashboard.py:36-62`
**Impact:** Dashboard `/api/dashboard/briefing` endpoint returns dummy data instead of real AI-generated briefings

**Details:**
The dashboard briefing endpoint is currently disabled and returns hardcoded test data:

```python
# TEMPORARY: Return hardcoded response for fast API response
# TODO: Re-enable full briefing generation once blocking issues are resolved
return {
    "date": "2024-01-15",
    "summary": "3 posts scheduled for this week...",
    # ... more hardcoded data
}
```

**Reproduction:**
1. Visit the Dashboard page
2. The briefing shown is always the same dummy data regardless of actual content state

**Possible Solutions:**
1. Investigate and fix the "blocking issues" mentioned in the TODO
2. Re-enable the actual `get_daily_briefing()` call
3. Optimize briefing generation if performance is the concern
4. Consider caching briefings with periodic regeneration

**Action Required:**
- [ ] Investigate root cause of why briefing generation was disabled
- [ ] Determine if issue is performance, reliability, or API quota related
- [ ] Test briefing generation in isolation
- [ ] Implement fix or document decision to keep hardcoded for now

---

## Technical Debt

### Async Database Operations

**Status:** 🟡 Medium Priority
**Files:** `backend/app/services/dashboard_service.py`
**Impact:** Dashboard queries could be slow under load

**TODOs:**
- Line 38: Make database operations async/non-blocking
- Line 53: Make weekly schedule lookup async
- Line 93: Make holiday lookup async
- Line 108: Make background task async

**Recommendation:** Migrate to async SQLAlchemy patterns for better performance

---

### Console.log Statements in Error Handlers

**Status:** 🟡 Low Priority
**Impact:** No structured error logging in production

**Files:**
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/PostDetail.tsx`
- `frontend/src/pages/WeeklySchedule.tsx`
- `frontend/src/lib/api.ts`

**Recommendation:** Implement proper logging service (e.g., Sentry, LogRocket) for production error tracking

---

### TypeScript `any` Types

**Status:** 🟢 Partially Fixed
**Impact:** Reduced type safety in some components

**Files Still Needing Work:**
- `frontend/src/pages/ContentBankPage.tsx` - ~10 uses of `any`
- `frontend/src/pages/PostDetail.tsx` - ~6 uses of `any`

**Note:** Most critical `any` types in NewPostWizard.tsx have been fixed

---

## Recently Fixed

### ✅ Bare Exception Handlers
- Fixed in `ayrshare_client.py` and `creatomate_client.py`
- Now use specific exception types: `ValueError, KeyError, TypeError`

### ✅ Empty Exception Handler
- Fixed in `main.py` startup sequence
- Now properly checks if database exists before closing

### ✅ Port Mismatch
- Fixed `.env` FRONTEND_URL to match vite.config.js port (5174)

### ✅ Audio Licensing Requirement - RESOLVED
- **Decision:** Using `AUDIO_MODE=MUTED_FOR_PLATFORM_MUSIC`
- Videos render without background music
- Users add trending TikTok/Instagram sounds manually after export
- AI still generates TikTok music search suggestions
- **No audio licensing verification required**
- See: `docs/AUDIO_LICENSING_CHECKLIST.md`

---

## Last Updated
December 4, 2025
