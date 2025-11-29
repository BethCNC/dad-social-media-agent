"""Audio-related models and enums."""

from enum import Enum


class AudioMode(str, Enum):
    """
    Audio behavior modes for rendered videos.

    - AUTO_STOCK_ONLY: always add our safe background track, no TikTok hints required.
    - AUTO_STOCK_WITH_TIKTOK_HINTS: add background track and also generate TikTok search phrases.
    - MUTED_FOR_PLATFORM_MUSIC: do not add background music; user will add sound in TikTok/IG.
    """

    AUTO_STOCK_ONLY = "AUTO_STOCK_ONLY"
    AUTO_STOCK_WITH_TIKTOK_HINTS = "AUTO_STOCK_WITH_TIKTOK_HINTS"
    MUTED_FOR_PLATFORM_MUSIC = "MUTED_FOR_PLATFORM_MUSIC"



