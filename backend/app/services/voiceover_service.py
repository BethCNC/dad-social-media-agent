"""Voiceover generation service.

This provides a thin abstraction over a configurable TTS provider so
scripts can be turned into voiceover audio files and used in Creatomate
renders.

NOTE:
- We deliberately do NOT hard-code a specific provider here.
- Configure the endpoint and auth via environment variables.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def generate_voiceover_url(script: str) -> str:
  """Generate a voiceover track for the given script and return a public URL.

  The actual TTS backend is configured via environment variables so you can
  plug in ElevenLabs, Google TTS, or another provider without changing call
  sites:

  - TTS_API_URL: base URL of a service that accepts JSON {"text": ..., ...}
  - TTS_API_KEY: optional API key passed as Authorization header
  - TTS_VOICE_ID: optional voice identifier, forwarded in the JSON payload

  Expected minimal response shape from the TTS service:
  {"audio_url": "https://.../file.mp3"}

  If configuration is missing or the provider does not respond as expected,
  this function will raise a RuntimeError with a clear message.
  """
  api_url = getattr(settings, "TTS_API_URL", None)
  if not api_url:
      raise RuntimeError(
          "TTS_API_URL is not configured. Set TTS_API_URL (and optionally "
          "TTS_API_KEY / TTS_VOICE_ID) in your backend .env to enable voiceover generation."
      )

  payload: dict[str, object] = {"text": script}
  voice_id: Optional[str] = getattr(settings, "TTS_VOICE_ID", None)
  if voice_id:
      payload["voice_id"] = voice_id

  headers: dict[str, str] = {"Content-Type": "application/json"}
  api_key: Optional[str] = getattr(settings, "TTS_API_KEY", None)
  if api_key:
      headers["Authorization"] = f"Bearer {api_key}"

  logger.info("Requesting TTS voiceover from configured provider at %s", api_url)

  try:
      async with httpx.AsyncClient(timeout=60.0) as client:
          response = await client.post(api_url, json=payload, headers=headers)
          response.raise_for_status()
          data = response.json()
  except httpx.HTTPStatusError as exc:
      logger.error("TTS provider HTTP error: %s", exc.response.status_code)
      raise RuntimeError(
          "Voiceover service returned an error. Please check your TTS configuration "
          "and try again."
      ) from exc
  except httpx.RequestError as exc:
      logger.error("TTS provider request error: %s", type(exc).__name__)
      raise RuntimeError("Could not reach voiceover service. Please try again.") from exc
  except Exception as exc:  # pragma: no cover - defensive
      logger.error("Unexpected TTS error: %s", exc)
      raise RuntimeError("An error occurred while generating voiceover audio.") from exc

  audio_url = data.get("audio_url") if isinstance(data, dict) else None
  if not isinstance(audio_url, str) or not audio_url:
      logger.error("TTS provider response missing 'audio_url': %s", data)
      raise RuntimeError(
          "Voiceover service did not return an audio_url field. "
          "Check your TTS_API_URL integration and provider documentation."
      )

  logger.info("Received voiceover audio URL from TTS provider: %s", audio_url[:80])
  return audio_url
