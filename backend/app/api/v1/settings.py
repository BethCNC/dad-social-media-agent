from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
from pathlib import Path

from app.core.config import get_settings

router = APIRouter()

# Path to the profile JSON file
# Using the same path logic as in gemini_client.py
CLIENT_PROFILE_PATH = Path(__file__).parent.parent.parent / "core" / "client_unicity_profile.json"

class ToneConfig(BaseModel):
    overall: str
    readingLevel: str
    personPerspective: str

class ComplianceRules(BaseModel):
    noDiseaseClaims: bool
    noGuaranteedIncome: bool
    alwaysIncludeHealthDisclaimer: bool
    avoidCopyingOfficialTextVerbatim: bool

class ComplianceConfig(BaseModel):
    sources: List[str]
    rules: ComplianceRules

class ProductConfig(BaseModel):
    label: str
    primaryUrl: str
    focus: List[str]

class HashtagsConfig(BaseModel):
    general: List[str]
    maxExtraPerPost: int

class DisclaimersConfig(BaseModel):
    health: str
    general: str

class ClientProfile(BaseModel):
    clientId: str
    brandName: str
    defaultReferralUrl: str
    tone: ToneConfig
    compliance: ComplianceConfig
    products: Dict[str, ProductConfig]
    hashtags: HashtagsConfig
    disclaimers: DisclaimersConfig

@router.get("", response_model=ClientProfile)
async def get_settings_profile():
    """Get the current client profile settings."""
    try:
        if not CLIENT_PROFILE_PATH.exists():
            raise HTTPException(status_code=404, detail="Profile configuration not found")
            
        with open(CLIENT_PROFILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load settings: {str(e)}")

@router.put("", response_model=ClientProfile)
async def update_settings_profile(profile: ClientProfile):
    """Update the client profile settings."""
    try:
        # Save back to JSON file
        with open(CLIENT_PROFILE_PATH, "w", encoding="utf-8") as f:
            # Convert Pydantic model to dict and dump to JSON with indentation
            json.dump(profile.model_dump(), f, indent=2)
            
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")
