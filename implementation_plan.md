# User Flow Improvement Plan

## Completed Improvements

### 1. Navigation Consistency
-   Added "Weekly Schedule" to the main sidebar navigation.
-   Fixed the "Back" button in `PostDetail` to return to the previous context (Weekly Schedule or Dashboard).

### 2. Video Library Integration
-   Added "Create Post" button to video cards in the Video Library.
-   Updated `NewPostWizard` to accept a pre-selected video and automatically advance to the relevant step.

### 3. Export Functionality
-   Added "Download Video" buttons to `NewPostWizard` (step 4) and `PostDetail`.
-   Users can now export rendered videos for manual upload to TikTok/Instagram.

### 4. Compliance & Brand Guidelines UI
-   **Added `ComplianceGuide` component** to Dashboard with tabbed interface:
    *   **DO tab**: Green-themed list of approved practices
    *   **DON'T tab**: Red-themed list of forbidden practices (with platform ban warning)
    *   **TikTok Tips tab**: Blue-themed algorithm optimization tips for 2025-2026
-   **Created `ComplianceQuickRef`**: Compact compliance card for critical rules
-   Positioned prominently on Dashboard to prevent account bans
-   All rules aligned with Unicity compliance guidelines and TikTok platform policies


## Remaining Gaps & Proposed Fixes

### 1. Wizard State Persistence
**Issue**: If the user refreshes the page during the multi-step wizard, they lose all progress.
**Plan**:
-   Implement `localStorage` persistence for the wizard state.
-   Clear storage upon successful post creation.

### 2. Error Handling & Empty States
**Issue**: Some pages might show generic errors or blank screens if data is missing.
**Plan**:
-   Audit `PostDetail` for invalid ID handling (currently shows "Post not found", which is good).
-   Ensure `WeeklySchedule` handles network errors gracefully (currently has error state).
-   Add retry buttons to all error states.

### 3. Mobile Responsiveness
**Issue**: Complex tables and grids might break on small screens.
**Plan**:
-   Test `WeeklySchedule` calendar view on mobile.
-   Ensure `NewPostWizard` steps are usable on mobile.

### 4. Performance Optimization
**Issue**: Large assets or many videos might slow down the library.
**Plan**:
-   Implement pagination for `VideoLibrary` if the list grows large.
-   Optimize image loading with lazy loading.

## Verification Steps
1.  Navigate to **Weekly Schedule** from the sidebar.
2.  Click on a post, then click "Back to Schedule" to verify flow.
3.  Go to **Video Library**, click "Create Post" on a video, and verify it opens the Wizard with the video selected.
4.  Complete the wizard flow to ensure no regressions.
