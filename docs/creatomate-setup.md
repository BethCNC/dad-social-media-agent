# Creatomate Template Setup Guide

This guide will walk you through creating a video template in Creatomate that will be used by the AI Social Media Co-Pilot to render TikTok and Instagram videos.

## Prerequisites

1. A Creatomate account (sign up at https://creatomate.com if needed)
2. Your Creatomate API key (found in your account settings)

## Step 1: Create a New Template

1. Log in to your Creatomate dashboard
2. Navigate to **Templates** in the sidebar
3. Click **Create Template** or **New Template**
4. Select **Video** as the template type

## Step 2: Configure Template Dimensions

1. Set the template dimensions to **1080 x 1920** (vertical 9:16 format for TikTok/Instagram)
2. This is the standard format for short-form vertical videos

## Step 3: Design Your Template Structure

Your template should include:

### Video Clips Container

1. Add a **Group** or **Composition** element that will hold your video clips
2. This group should:
   - Fill the entire canvas (100% width and height)
   - Be configured to display video clips sequentially or in a sequence

### Text Overlay for Script

1. Add a **Text** element for displaying the script
2. Position it at the bottom of the screen (recommended: y: 80%, centered)
3. Configure the text styling:
   - Font: Arial or similar readable font
   - Font size: 24px or larger (adjustable)
   - Font weight: 600 (semi-bold)
   - Text color: White (#ffffff)
   - Stroke/outline: Black (#000000) with 2px width for readability
   - Text align: Center
   - Width: 90% of canvas

## Step 4: Add Template Variables

Creatomate templates use variables to accept dynamic content. You need to create variables for:

### Variable 1: Video Clips Array

1. In your video clips container/group, add a variable named: `video_clips`
2. This variable should accept an array of video URLs
3. Configure the element to loop through or display videos from this array

**Note:** The exact variable name depends on how Creatomate handles arrays. Common approaches:
- If Creatomate supports array variables directly, use `video_clips` as an array
- If you need individual variables, you might need `video_clip_1`, `video_clip_2`, etc. (the app will need to be updated accordingly)

### Variable 2: Script Text

1. In your text overlay element, add a variable named: `script_text`
2. This will contain the spoken script text that will be displayed on the video

## Step 5: Test Your Template

1. Use Creatomate's preview/test feature
2. Test with sample data:
   - `video_clips`: `["https://example.com/video1.mp4", "https://example.com/video2.mp4"]`
   - `script_text`: `"This is a test script for your video"`
3. Verify that:
   - Videos play correctly in sequence
   - Text displays properly at the bottom
   - The output is 1080x1920 vertical format

## Step 6: Get Your Template ID

1. Once your template is saved, navigate to the template details page
2. Find the **Template ID** (usually displayed in the URL or template settings)
3. Copy this ID - you'll need it for the `CREATOMATE_TEMPLATE_ID` environment variable

**Template ID format:** Usually a UUID or alphanumeric string like `abc123def456`

## Step 7: Configure the Application

Add your template ID to your `.env` file:

```bash
CREATOMATE_TEMPLATE_ID=your_template_id_here
```

## Template Variable Reference

The application will pass the following variables to your template:

| Variable Name | Type | Description | Example |
|--------------|------|-------------|---------|
| `video_clips` | Array of strings | URLs of video clips from Pexels | `["https://videos.pexels.com/video-files/123.mp4", ...]` |
| `script_text` | String | The spoken script text | `"Here are 3 tips for better energy..."` |

## Troubleshooting

### Template Not Found Error

- Verify your `CREATOMATE_TEMPLATE_ID` is correct
- Ensure the template is published/shared (if required by your Creatomate plan)
- Check that you're using the correct Creatomate account

### Videos Not Displaying

- Verify that `video_clips` variable is correctly configured in your template
- Check that video URLs are accessible (Pexels URLs should work)
- Ensure your template can handle the number of videos being passed

### Text Not Appearing

- Verify that `script_text` variable is correctly bound to your text element
- Check text element positioning and styling
- Ensure text element is not hidden or behind other elements

## Alternative: Using Individual Video Variables

If Creatomate doesn't support array variables directly, you may need to:

1. Create individual variables: `video_clip_1`, `video_clip_2`, `video_clip_3`, etc.
2. Update the application code in `backend/app/services/creatomate_client.py` to pass individual variables instead of an array
3. Configure your template to use these individual variables

## Next Steps

After setting up your template:

1. Test the full workflow:
   - Generate a content plan
   - Search for video clips
   - Render a video using your template
   - Verify the output looks correct

2. Adjust template styling as needed:
   - Font sizes, colors, positioning
   - Video clip transitions or effects
   - Text animation or timing

3. Create additional templates for different video styles if desired

## Resources

- [Creatomate Documentation](https://creatomate.com/docs)
- [Creatomate Template Editor Guide](https://creatomate.com/docs/template-editor)
- [Creatomate API Reference](https://creatomate.com/docs/api)

