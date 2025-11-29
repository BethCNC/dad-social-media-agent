# Finding Your Creatomate Template Element Names

## Problem

If your rendered video only shows one video clip and no text, it means the element names in your template don't match what the application is sending.

## How to Find Element Names in Creatomate

1. **Open your template in Creatomate's template editor**
2. **Select each element** (video clips and text elements)
3. **Check the element name** in the properties panel on the right
   - Look for a field labeled "Name" or "ID"
   - This is the name you need to use in modifications

## Common Element Name Patterns

Creatomate templates can use various naming conventions:

- `Background-1`, `Background-2`, `Text-1`, `Text-2` (what we're currently using)
- `Video-1`, `Video-2`, `Text-1`, `Text-2`
- `Clip-1`, `Clip-2`, `Caption-1`, `Caption-2`
- `Background`, `Background2`, `Text`, `Text2`
- Custom names you've set

## How to Update the Application

Once you know your template's element names, you need to update `backend/app/services/creatomate_client.py`:

### For Video Templates

Find this section (around line 73-83):
```python
if asset_urls:
    if len(asset_urls) >= 1:
        modifications["Background-1.source"] = asset_urls[0]
    if len(asset_urls) >= 2:
        modifications["Background-2.source"] = asset_urls[1]
```

Replace `Background-1` and `Background-2` with your actual element names.

### For Text Elements

Find this section (around line 108-110):
```python
modifications["Text-1.text"] = text_1 if text_1 else script_text
modifications["Text-2.text"] = text_2 if text_2 else ""
```

Replace `Text-1` and `Text-2` with your actual text element names.

## Example

If your template uses:
- `Video-1` and `Video-2` for video clips
- `Caption` and `Subtitle` for text

You would change:
```python
# Video clips
modifications["Video-1.source"] = asset_urls[0]
modifications["Video-2.source"] = asset_urls[1]

# Text
modifications["Caption.text"] = text_1 if text_1 else script_text
modifications["Subtitle.text"] = text_2 if text_2 else ""
```

## Verification

After updating, check the backend logs when rendering. You should see:
```
Modifications being sent: {'Video-1.source': 'https://...', 'Video-2.source': 'https://...', 'Caption.text': '...', 'Subtitle.text': '...'}
```

If the element names match your template, both videos and text should appear in the rendered output.

## Still Not Working?

1. **Check the Creatomate template editor** - Make sure elements are visible and not hidden
2. **Verify element properties** - Text elements need to have their text property bound to a variable or modification
3. **Check template structure** - Make sure video elements are set up to display sequentially or in a composition
4. **Review backend logs** - Look for any error messages from Creatomate API

