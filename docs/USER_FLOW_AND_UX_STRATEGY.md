# User Flow & UX Strategy
## AI Social Media Co-Pilot - Headless Video Creation Workflow

**Last Updated:** December 2, 2024  
**Purpose:** Define clear user flows for bulk content creation and daily posting workflows

---

## 🎯 Core Problem Statement

**The Challenge:**
- Users need to **post daily** to add trending audio/music manually in TikTok/Instagram
- Bulk scheduling via API doesn't work because:
  - Trending sounds change daily
  - Users must manually select audio in TikTok/Instagram apps
  - Audio selection happens at posting time, not scheduling time
- Users need **two distinct workflows**:
  1. **Planning Mode**: Bulk create content in advance (weekly/monthly planning)
  2. **Daily Posting Mode**: Create one post → download → add music → post manually

**The Solution:**
Separate "planning" from "posting" - the app creates content, users post manually with trending audio.

---

## 📊 User Personas & Use Cases

### Persona A: Daily Poster (Primary Use Case)
**Who:** Your dad or similar non-technical user  
**Goal:** Post 1 video per day to TikTok/Instagram  
**Workflow:**
1. Create one post in the morning
2. Download the video
3. Open TikTok/Instagram app
4. Upload video, add trending audio
5. Paste pre-generated caption
6. Post

**Pain Points:**
- Needs simple, one-at-a-time workflow
- Doesn't want to think about scheduling
- Just wants to create → download → post

### Persona B: Batch Planner (Secondary Use Case)
**Who:** You or a VA helping manage content  
**Goal:** Plan a week/month of content in advance  
**Workflow:**
1. Generate weekly/monthly schedule
2. Review and edit content
3. Download videos as needed
4. Post manually when ready (with trending audio)

**Pain Points:**
- Wants to see the full week/month at once
- Needs to edit and refine content
- Wants to download multiple videos for later posting

---

## 🔄 Proposed User Flows

### Flow 1: Daily Post Creation (Primary)
**Purpose:** Create one post for today, download, post manually

**Steps:**
1. **Dashboard** → Click "Create Post for Today"
2. **Wizard Step 1**: Enter topic or use suggested idea
3. **Wizard Step 2**: Review/edit script & caption
4. **Wizard Step 3**: Select video/image assets
5. **Wizard Step 4**: Render video → Download
6. **Success Screen**: 
   - Download button (prominent)
   - Copy caption button
   - Instructions: "Download → Open TikTok → Upload → Add trending audio → Paste caption → Post"

**Key Features:**
- Fast, focused on single post
- Clear download action
- No scheduling step (manual posting)
- Caption ready to copy/paste

---

### Flow 2: Weekly Planning (Secondary)
**Purpose:** Generate and plan a week of content in advance

**Steps:**
1. **Schedule Page** → Click "Generate This Week"
2. **AI generates 7 posts** with topics, scripts, captions
3. **Calendar/List View**: See all 7 posts
4. **Click any post** → Edit, render, download
5. **Download individually** as needed for daily posting

**Key Features:**
- Bulk generation for planning
- Visual calendar view
- Individual post management
- Download on-demand (not auto-scheduled)

---

### Flow 3: Content Library (Supporting)
**Purpose:** View, manage, and re-download all created content

**Steps:**
1. **Library Page** → See all created posts
2. **Filter by status**: Draft, Ready, Published
3. **Click post** → View details, re-download, edit
4. **Bulk actions**: Download multiple, regenerate

**Key Features:**
- Centralized content management
- Re-download capability
- Status tracking
- Search and filter

---

## 🎨 Proposed UI Structure

### Navigation Structure
```
Dashboard (Home)
├── Create Post for Today (primary CTA)
├── Quick Stats
└── Today's Suggested Content

Schedule
├── Generate This Week (bulk planning)
├── Calendar View (7-day grid)
└── Individual Post Management

Library
├── All Created Content
├── Filter by Status/Date
└── Bulk Actions

Create Post (Wizard)
├── Step 1: Topic/Idea
├── Step 2: Script & Caption
├── Step 3: Assets
└── Step 4: Render & Download
```

### Page Hierarchy

**1. Dashboard (`/`)**
- **Primary CTA**: "Create Post for Today" (large, prominent)
- **Secondary CTA**: "Plan This Week" (smaller, links to Schedule)
- **Quick Stats**: Posts created this week, ready to post
- **Today's Suggestion**: AI-suggested topic based on trends/calendar

**2. Create Post (`/wizard` or `/create`)**
- **4-step wizard** (no scheduling step)
- **Final step**: Download + Copy Caption
- **Success message**: "Download complete! Next: Add trending audio in TikTok/Instagram"

**3. Schedule (`/schedule`)**
- **Generate Week** button (if no schedule exists)
- **Calendar/List view** of generated posts
- **Click post** → Edit, render, download
- **No auto-scheduling** - all manual posting

**4. Library (`/library`)**
- **All posts** (from wizard + schedule)
- **Status badges**: Draft, Ready, Published
- **Actions**: Download, Edit, Delete
- **Search & filter**

---

## 🔧 Implementation Changes Needed

### 1. Remove Scheduling Step from Wizard
**Current:** Wizard has 5 steps including scheduling  
**New:** Wizard has 4 steps, ends with download

**Changes:**
- Remove scheduling form from `NewPostWizard.tsx`
- Final step focuses on download + caption copy
- Add clear instructions for manual posting

### 2. Update Dashboard Primary CTA
**Current:** "Create New Post" (generic)  
**New:** "Create Post for Today" (action-oriented)

**Changes:**
- Update `Dashboard.tsx` CTA text
- Add secondary "Plan This Week" link
- Show today's suggested topic

### 3. Clarify Schedule Page Purpose
**Current:** "Weekly Schedule" (unclear if it's for planning or posting)  
**New:** "Content Planning" or "Weekly Planning"

**Changes:**
- Rename to "Content Planning" or keep "Schedule" but clarify it's for planning
- Add explanation: "Plan your week, then download and post daily"
- Remove any scheduling API calls (keep manual posting)

### 4. Add Status Tracking
**Current:** Posts don't track if they've been downloaded/posted  
**New:** Add status: Draft → Ready → Downloaded → Published

**Changes:**
- Add status field to post model
- Update status when user downloads
- Show status badges in Library

### 5. Improve Download Flow
**Current:** Download button exists but flow isn't clear  
**New:** Prominent download + clear next steps

**Changes:**
- Large download button in wizard final step
- Copy caption button (already exists)
- Clear instructions: "1. Download 2. Open TikTok 3. Upload 4. Add audio 5. Paste caption 6. Post"

---

## 📱 User Journey Maps

### Journey 1: Daily Morning Routine (5 minutes)
```
1. Open app → Dashboard
2. See "Create Post for Today" → Click
3. Enter topic or use suggestion → Generate
4. Review script/caption (30 seconds)
5. Select video (30 seconds)
6. Render video (1-2 minutes)
7. Download video + Copy caption
8. Open TikTok app
9. Upload video, add trending audio
10. Paste caption, post
```

**Total Time:** ~5 minutes from idea to posted

---

### Journey 2: Weekly Planning Session (30 minutes)
```
1. Open app → Schedule
2. Click "Generate This Week"
3. Wait for 7 posts to generate (2-3 minutes)
4. Review calendar view
5. Click each post → Review/edit
6. Render videos for posts you want (5-10 minutes)
7. Download videos as needed
8. Throughout the week: Post daily with trending audio
```

**Total Time:** ~30 minutes for planning, then 5 min/day for posting

---

## 🎯 Success Metrics

**User can:**
- ✅ Create one post in < 5 minutes
- ✅ Download video and post manually with trending audio
- ✅ Plan a week of content in one session
- ✅ Find and re-download any created content
- ✅ Understand the workflow without confusion

**App should:**
- ✅ Make daily posting the primary, obvious flow
- ✅ Make bulk planning secondary but accessible
- ✅ Never suggest auto-scheduling (manual posting only)
- ✅ Provide clear next steps after download

---

## 🚀 Implementation Priority

### Phase 1: Core Flow Clarity (High Priority)
1. ✅ Update Dashboard primary CTA to "Create Post for Today"
2. ✅ Remove scheduling step from wizard
3. ✅ Enhance download step with clear instructions
4. ✅ Update Schedule page to clarify it's for planning

### Phase 2: Status & Library (Medium Priority)
1. Add status tracking (Draft → Ready → Downloaded)
2. Improve Library page with filters
3. Add bulk download capability

### Phase 3: Enhancements (Low Priority)
1. Add "Today's Suggested Topic" to Dashboard
2. Add quick stats (posts created this week)
3. Add search in Library

---

## 📝 Key UX Principles

1. **Daily Posting is Primary**: Make single-post creation the most obvious action
2. **Planning is Secondary**: Bulk generation is for planning, not auto-posting
3. **Manual Posting Only**: Never suggest API scheduling (users need trending audio)
4. **Download-First**: All workflows end with download, not scheduling
5. **Clear Next Steps**: Always show what to do after download
6. **Simple Language**: "Create Post for Today" not "Generate Content Asset"

---

## 🔄 Current vs. Proposed Flow Comparison

### Current Flow (Confusing)
```
Dashboard → "Create New Post" → Wizard (5 steps) → Schedule? → Confusion
Schedule → Generate Week → Posts → ??? → How do I post?
```

### Proposed Flow (Clear)
```
Dashboard → "Create Post for Today" → Wizard (4 steps) → Download → Post manually
Schedule → "Generate This Week" → Plan → Download individually → Post daily
Library → View all → Download any → Post when ready
```

---

## ✅ Next Steps

1. **Update Dashboard** - Change primary CTA and messaging
2. **Simplify Wizard** - Remove scheduling, enhance download step
3. **Clarify Schedule** - Add explanation that it's for planning
4. **Test Flow** - Walk through daily posting journey
5. **Gather Feedback** - Test with actual user (your dad)

---

## 📚 References

- [TikTok Growth Playbook](./TikTok Growth Playbook.md) - Daily posting strategy
- [Audio Legal Notes](./audio-legal-notes.md) - Manual audio workflow
- [PRD](./.cursor/rules/prd.mdc) - Original product requirements

