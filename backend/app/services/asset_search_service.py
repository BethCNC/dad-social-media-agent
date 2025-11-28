"""Enhanced asset search service with context-aware relevance scoring."""
import logging
from typing import List, Optional
from app.models.video import AssetResult
from app.services.pexels_client import search_videos

logger = logging.getLogger(__name__)

# Unicity wellness keywords to boost search relevance
UNICITY_WELLNESS_BOOST_TERMS = [
    "wellness", "healthy", "lifestyle", "metabolic health", 
    "fresh", "nutritious", "balanced", "peaceful", "energizing"
]


def extract_search_keywords(
    topic: str,
    hook: str,
    script: str,
    shot_description: str,
    content_pillar: str,
    suggested_keywords: Optional[List[str]] = None
) -> List[str]:
    """
    Extract and prioritize search keywords from post content.
    
    Returns a list of search queries ordered by relevance.
    """
    keywords = []
    
    # Priority 1: Shot description (most specific) - enhance with Unicity wellness themes
    if shot_description:
        # Clean and enhance shot description
        cleaned = shot_description.lower().strip()
        
        # Add Unicity-specific wellness keywords based on content pillar
        unicity_wellness_keywords = {
            "education": "wellness healthy lifestyle metabolic health",
            "routine": "morning evening routine healthy lifestyle peaceful",
            "story": "wellness lifestyle transformation healthy",
            "product_integration": "wellness product healthy lifestyle"
        }
        
        # Add pillar-specific wellness context
        wellness_context = unicity_wellness_keywords.get(content_pillar, "wellness healthy lifestyle")
        
        # Combine shot description with wellness context (limit to 8-10 words max)
        enhanced = f"{cleaned} {wellness_context}".strip()
        words = enhanced.split()
        if len(words) > 10:
            # Keep shot description words + add 2-3 wellness keywords
            shot_words = cleaned.split()[:7]  # Keep first 7 words from shot
            wellness_words = wellness_context.split()[:3]  # Add 3 wellness keywords
            enhanced = " ".join(shot_words + wellness_words)
        
        keywords.append(enhanced)
    
    # Priority 2: Suggested keywords from AI
    if suggested_keywords:
        for kw in suggested_keywords[:3]:  # Top 3
            if kw and len(kw.split()) <= 4:  # Keep phrases short
                keywords.append(kw.lower().strip())
    
    # Priority 3: Extract from topic (main subject)
    topic_words = topic.lower().split()
    # Filter out common words, keep meaningful ones
    meaningful_words = [w for w in topic_words if len(w) > 3 and w not in ['the', 'for', 'with', 'this', 'that']]
    if meaningful_words:
        topic_query = " ".join(meaningful_words[:4])  # Max 4 words
        keywords.append(topic_query)
    
    # Priority 4: Extract from hook (key phrases)
    hook_words = hook.lower().split()
    # Look for action phrases or key concepts
    if len(hook_words) >= 2:
        hook_phrase = " ".join(hook_words[:3])  # First 3 words often contain key concept
        keywords.append(hook_phrase)
    
    # Priority 5: Extract from script (first sentence often has main concept)
    script_first_sentence = script.split('.')[0].lower().strip()
    script_words = script_first_sentence.split()
    if len(script_words) >= 2:
        script_phrase = " ".join(script_words[:4])
        keywords.append(script_phrase)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_keywords = []
    for kw in keywords:
        if kw and kw not in seen:
            seen.add(kw)
            unique_keywords.append(kw)
    
    return unique_keywords[:5]  # Return top 5 search strategies


def score_relevance(
    asset: AssetResult,
    search_query: str,
    content_pillar: str,
    topic: str
) -> float:
    """
    Score asset relevance based on multiple factors.
    
    Returns a score from 0.0 to 1.0 (higher = more relevant).
    """
    score = 0.5  # Base score
    
    # Factor 1: Query match (if we had access to video title/description)
    # For now, we'll use duration as a proxy (relevant videos are often 5-30 seconds)
    if 5 <= asset.duration_seconds <= 30:
        score += 0.2
    elif 30 < asset.duration_seconds <= 60:
        score += 0.1
    
    # Factor 2: Content pillar alignment (heuristic based on duration)
    # Education/Product: shorter clips (5-15s) work well
    # Routine/Story: medium clips (15-30s) work well
    if content_pillar in ["education", "product_integration"]:
        if 5 <= asset.duration_seconds <= 15:
            score += 0.15
    elif content_pillar in ["routine", "story"]:
        if 15 <= asset.duration_seconds <= 30:
            score += 0.15
    
    # Factor 3: Quality (longer videos often have better quality)
    if asset.duration_seconds >= 10:
        score += 0.1
    
    return min(score, 1.0)


async def search_relevant_assets(
    topic: str,
    hook: str,
    script: str,
    shot_plan: List[dict],
    content_pillar: str,
    suggested_keywords: Optional[List[str]] = None,
    max_results: int = 12
) -> List[AssetResult]:
    """
    Context-aware asset search using multiple strategies.
    
    Uses topic, hook, script, shot plan, and content pillar to find
    the most relevant stock videos/images.
    
    Args:
        topic: Post topic
        hook: Post hook
        script: Post script
        shot_plan: List of shot descriptions
        content_pillar: Content pillar (education, routine, story, product_integration)
        suggested_keywords: Optional AI-suggested keywords
        max_results: Maximum number of results to return
        
    Returns:
        List of AssetResult objects, sorted by relevance
    """
    all_results: List[AssetResult] = []
    seen_ids = set()
    
    # Strategy 1: Search using each shot description (most specific) with Unicity wellness enhancement
    for shot in shot_plan[:3]:  # Use first 3 shots
        shot_desc = shot.get("description", "")
        if not shot_desc:
            continue
        
        keywords = extract_search_keywords(
            topic=topic,
            hook=hook,
            script=script,
            shot_description=shot_desc,
            content_pillar=content_pillar,
            suggested_keywords=suggested_keywords
        )
        
        # Try the most specific query first (shot description with wellness context)
        if keywords:
            try:
                # Add Unicity wellness boost terms if not already present
                primary_query = keywords[0]
                wellness_boost = ["wellness", "healthy", "lifestyle"]
                query_words = primary_query.split()
                
                # Add 1-2 wellness terms if they're not already there
                for boost_term in wellness_boost:
                    if boost_term not in query_words and len(query_words) < 8:
                        query_words.append(boost_term)
                        break
                
                enhanced_query = " ".join(query_words)
                results = await search_videos(enhanced_query, max_results=8)
                for result in results:
                    if result.id not in seen_ids:
                        seen_ids.add(result.id)
                        all_results.append(result)
            except Exception as e:
                logger.warning(f"Search failed for shot description '{shot_desc}': {e}")
    
    # Strategy 2: Search using topic + content pillar context
    if len(all_results) < max_results:
        topic_keywords = extract_search_keywords(
            topic=topic,
            hook=hook,
            script=script,
            shot_description="",
            content_pillar=content_pillar,
            suggested_keywords=suggested_keywords
        )
        
        if topic_keywords:
            try:
                # Use topic-based query with wellness boost
                query = topic_keywords[0] if topic_keywords else topic.lower()
                # Add wellness context if not already present
                query_words = query.split()
                if "wellness" not in query_words and "healthy" not in query_words:
                    query_words.append("wellness")
                enhanced_query = " ".join(query_words[:10])  # Limit to 10 words
                results = await search_videos(enhanced_query, max_results=6)
                for result in results:
                    if result.id not in seen_ids:
                        seen_ids.add(result.id)
                        all_results.append(result)
            except Exception as e:
                logger.warning(f"Search failed for topic '{topic}': {e}")
    
    # Strategy 3: Search using suggested keywords if available
    if suggested_keywords and len(all_results) < max_results:
        for keyword in suggested_keywords[:2]:  # Top 2 suggested keywords
            if len(keyword.split()) <= 3:  # Keep it short
                try:
                    results = await search_videos(keyword.lower(), max_results=4)
                    for result in results:
                        if result.id not in seen_ids:
                            seen_ids.add(result.id)
                            all_results.append(result)
                except Exception as e:
                    logger.warning(f"Search failed for keyword '{keyword}': {e}")
    
    # Score and sort by relevance
    scored_results = []
    for asset in all_results:
        # Use first shot description for scoring
        primary_query = shot_plan[0].get("description", "") if shot_plan else topic
        score = score_relevance(asset, primary_query, content_pillar, topic)
        scored_results.append((score, asset))
    
    # Sort by score (descending) and return top results
    scored_results.sort(key=lambda x: x[0], reverse=True)
    top_results = [asset for _, asset in scored_results[:max_results]]
    
    return top_results

