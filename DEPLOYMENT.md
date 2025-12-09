# Deployment Notice

**Production URL**: https://myles.bethcnc.com

## Recent Deployment

Last deployed: 2025-12-08

## Known Issues

If experiencing blank page or "clamp is not a function" error:
1. Clear browser cache (CMD+Shift+R / CTRL+Shift+R)
2. Check that all environment variables are set in Coolify
3. Verify build completed successfully

## Environment Variables Required in Coolify

- `GOOGLE_API_KEY`
- `CREATOMATE_API_KEY`
- `CREATOMATE_IMAGE_TEMPLATE_ID`
- `CREATOMATE_VIDEO_TEMPLATE_ID`
- `AYRSHARE_API_KEY`
- `PEXELS_API_KEY` (optional but recommended)
- `APIFY_API_TOKEN` (optional)

## Troubleshooting

If deployment fails with container exit:
- Check all required env vars are present
- Review deployment logs in Coolify
- Ensure database migrations completed
