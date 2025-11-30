# Page Testing & Fixes - Action Plan

## Current Status
- **Dashboard** ✅ Redesigned and working
- **NewPostWizard** ⚠️ Needs testing
- **WeeklySchedule** ⚠️ Needs testing
- **PostDetail** ⚠️ Needs testing
- **VideoLibrary** ⚠️ Needs testing

## Testing Order (User Flow Priority)

### 1. NewPostWizard (`/wizard`) - CRITICAL PATH
**User Flow:** Dashboard → Create Post Now → Wizard

**Steps to Test:**
1. Content Type Selection (Step 0)
   - Single Post
   - Weekly Schedule (7 posts)
   - Monthly Schedule (30 posts)
   - Custom (user picks number)

2. Topic Selection (Step 1) - For Single Post
   - Enter topic/idea
   - Select tone
   - Choose platforms
   - Optional: length

3. Script & Caption Review (Step 2)
   - AI generates script
   - AI generates caption with compliance
   - User can edit both

4. Visual Selection (Step 3)
   - Toggle: AI Generated vs Stock Video
   - Generate/Search for visuals
   - Select exactly 2 assets
   - Regenerate individual images

5. Video Rendering (Step 4)
   - Auto-starts rendering
   - Shows progress
   - Displays video when complete
   - Download button appears

6. Scheduling (Step 5) - Optional
   - Choose platforms
   - Post now or schedule
   - Submit

**Known Issues to Fix:**
- [ ] Ensure all steps work sequentially
- [ ] Validate asset selection (exactly 2)
- [ ] Test video rendering with Creatomate
- [ ] Verify download functionality
- [ ] Check compliance in generated captions

---

### 2. WeeklySchedule (`/weekly`)
**User Flow:** Dashboard → Weekly Schedule Card → Weekly View

**Features to Test:**
- [ ] Generate new weekly schedule (7 posts)
- [ ] View existing schedule
- [ ] Edit individual posts
- [ ] Regenerate post text
- [ ] Render videos for posts
- [ ] Navigate to post detail

**Known Issues to Fix:**
- [ ] Ensure schedule generation works
- [ ] Test post editing
- [ ] Verify navigation to/from post detail

---

### 3. VideoLibrary (`/videos`)
**User Flow:** Dashboard → Video Library Card → Upload/Manage Videos

**Features to Test:**
- [ ] Upload new videos
- [ ] View uploaded videos
- [ ] Delete videos
- [ ] "Create Post" button on video cards
- [ ] Navigate to wizard with pre-selected video

**Known Issues to Fix:**
- [ ] Test video upload
- [ ] Verify "Create Post" flow
- [ ] Check video deletion

---

### 4. PostDetail (`/posts/:id`)
**User Flow:** Weekly Schedule → Click Post → Post Detail

**Features to Test:**
- [ ] View post details (script, caption, media)
- [ ] Edit script/caption
- [ ] Regenerate text
- [ ] Search alternative media
- [ ] Render preview
- [ ] Download video
- [ ] Back navigation (context-aware)

**Known Issues to Fix:**
- [ ] Test edit functionality
- [ ] Verify regenerate
- [ ] Check download button
- [ ] Test back navigation

---

## Priority Fixes (In Order)

### Phase 1: Critical Path (NewPostWizard)
1. Test single post creation end-to-end
2. Fix any blocking errors
3. Ensure video renders and downloads

### Phase 2: Content Management (WeeklySchedule)
1. Test weekly schedule generation
2. Fix post editing
3. Verify navigation

### Phase 3: Asset Management (VideoLibrary)
1. Test video upload
2. Fix "Create Post" integration
3. Verify deletion

### Phase 4: Post Management (PostDetail)
1. Test post viewing
2. Fix editing
3. Verify download

---

## Next Steps

1. **Start with NewPostWizard** - Most critical
2. **Test each step manually** in browser
3. **Document errors** as we find them
4. **Fix systematically** one page at a time
5. **Re-test** after each fix

---

## Testing Checklist Template

For each page:
- [ ] Page loads without errors
- [ ] All buttons/links work
- [ ] API calls succeed
- [ ] Error states handled gracefully
- [ ] Loading states shown
- [ ] Navigation works correctly
- [ ] Data persists correctly
- [ ] UI is responsive
- [ ] Compliance rules followed (where applicable)
