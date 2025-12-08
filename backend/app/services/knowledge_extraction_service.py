"""Service for extracting structured knowledge from raw text and URLs."""
import logging
import re
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
client = genai.Client(api_key=settings.GOOGLE_API_KEY)

async def extract_knowledge_from_text(
    raw_text: str,
    source_hint: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Use Gemini to extract structured knowledge chunks from raw text.
    
    Args:
        raw_text: Raw text (email, webpage, etc.)
        source_hint: Optional hint about source type (email, webpage, manual)
        
    Returns:
        List of knowledge chunks with content, category
    """
    system_message = """You are a knowledge extraction assistant for a Unicity wellness brand.

Your job is to read raw text (emails, web pages, notes) and extract SPECIFIC, ACTIONABLE knowledge chunks that would help an AI content writer create better social media posts.

WHAT TO EXTRACT:
- Product information (features, benefits, ingredients)
- Promotions and sales (dates, discounts, terms)
- Brand messaging and positioning
- Compliance guidelines
- Success stories or testimonials
- New product launches
- Event announcements

WHAT TO SKIP:
- Generic filler text
- Navigation or footer content
- Overly vague statements
- Duplicate information

OUTPUT FORMAT:
Return a JSON array of knowledge items:
[
  {
    "content": "Specific, factual statement (1-3 sentences max)",
    "category": "product|promotion|compliance|brand|event|story"
  }
]

Be concise. Each chunk should be standalone and useful."""

    user_message = f"""Extract knowledge from this text:

{raw_text}

Source type: {source_hint or 'unknown'}

Return ONLY the JSON array of knowledge items."""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=f"{system_message}\n\n{user_message}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            )
        )
        
        content = response.text
        if not content:
            return []
        
        import json
        data = json.loads(content)
        
        # Handle both array and object with 'items' key
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'items' in data:
            return data['items']
        else:
            logger.warning(f"Unexpected response format: {data}")
            return []
            
    except Exception as e:
        logger.error(f"Knowledge extraction error: {e}")
        return []


async def extract_knowledge_from_url(url: str) -> List[Dict[str, str]]:
    """
    Fetch and extract knowledge from a URL.
    
    Args:
        url: URL to scrape
        
    Returns:
        List of knowledge chunks
    """
    import httpx
    from bs4 import BeautifulSoup
    
    try:
        # Fetch content
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.get(url)
            response.raise_for_status()
            html = response.text
        
        # Parse HTML and extract text
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text
        text = soup.get_text(separator='\n', strip=True)
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        text = '\n'.join(line for line in lines if line)
        
        # Limit length to avoid token limits (keep first 10000 chars)
        text = text[:10000]
        
        logger.info(f"Extracted {len(text)} characters from {url}")
        
        # Extract knowledge using AI
        return await extract_knowledge_from_text(text, source_hint="webpage")
        
    except Exception as e:
        logger.error(f"URL extraction error for {url}: {e}")
        raise


def is_email_content(text: str) -> bool:
    """Detect if text looks like an email."""
    email_indicators = [
        r'subject:',
        r'from:',
        r'to:',
        r'dear\s+\w+',
        r'hi\s+\w+',
        r'hello\s+\w+',
    ]
    
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in email_indicators)


async def smart_add_knowledge(
    raw_input: str,
    source: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Intelligently add knowledge from raw input.
    Detects if input is a URL, email, or plain text and processes accordingly.
    
    Args:
        raw_input: Raw text or URL
        source: Optional source description
        
    Returns:
        List of extracted knowledge chunks
    """
    # Check if it's a URL
    url_pattern = r'https?://[^\s]+'
    url_match = re.match(url_pattern, raw_input.strip())
    
    if url_match:
        logger.info(f"Detected URL input: {raw_input}")
        return await extract_knowledge_from_url(raw_input.strip())
    
    # Check if it's an email
    if is_email_content(raw_input):
        logger.info("Detected email content")
        source_hint = "email"
    else:
        source_hint = source or "manual"
    
    return await extract_knowledge_from_text(raw_input, source_hint=source_hint)
