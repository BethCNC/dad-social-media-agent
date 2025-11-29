#!/usr/bin/env python3
"""Helper script to check .env file and show what's needed."""
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
ENV_FILE = PROJECT_ROOT / ".env"
ENV_EXAMPLE = PROJECT_ROOT / ".env.example"

print("=" * 60)
print("Environment Variables Check")
print("=" * 60)
print(f"\n.env file location: {ENV_FILE}")
print(f".env file exists: {ENV_FILE.exists()}")
if ENV_FILE.exists():
    size = ENV_FILE.stat().st_size
    print(f".env file size: {size} bytes")
    if size == 0:
        print("⚠️  WARNING: .env file is EMPTY!")
    else:
        print("✓ .env file has content")
else:
    print("⚠️  WARNING: .env file does NOT exist!")

print("\n" + "=" * 60)
print("Required Environment Variables:")
print("=" * 60)

required_vars = [
    "OPENAI_API_KEY",
    "PEXELS_API_KEY",
    "CREATOMATE_API_KEY",
    "CREATOMATE_IMAGE_TEMPLATE_ID",
    "CREATOMATE_VIDEO_TEMPLATE_ID",
    "AYRSHARE_API_KEY",
]

missing = []
for var in required_vars:
    value = os.environ.get(var)
    if value:
        print(f"✓ {var}: SET (length: {len(value)})")
    else:
        print(f"✗ {var}: NOT SET")
        missing.append(var)

print("\n" + "=" * 60)
if missing:
    print(f"⚠️  Missing {len(missing)} required environment variable(s)")
    print("\nTo fix this:")
    print(f"1. Open {ENV_FILE} in a text editor")
    print("2. Add your API keys in this format:")
    print("\n   OPENAI_API_KEY=your_key_here")
    print("   PEXELS_API_KEY=your_key_here")
    print("   CREATOMATE_API_KEY=your_key_here")
    print("   CREATOMATE_IMAGE_TEMPLATE_ID=your_id_here")
    print("   CREATOMATE_VIDEO_TEMPLATE_ID=your_id_here")
    print("   AYRSHARE_API_KEY=your_key_here")
    print("\n3. Save the file and restart the backend server")
    if ENV_EXAMPLE.exists():
        print(f"\nYou can also copy from {ENV_EXAMPLE} as a template")
else:
    print("✓ All required environment variables are set!")
print("=" * 60)

