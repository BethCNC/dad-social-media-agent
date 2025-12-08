"""Service for managing the 'knowledge base' (RAG) for the specific brand."""
import logging
import json
import math
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import KnowledgeItem
from app.services.gemini_client import generate_embedding

logger = logging.getLogger(__name__)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude1 = math.sqrt(sum(a * a for a in v1))
    magnitude2 = math.sqrt(sum(b * b for b in v2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

async def add_knowledge_item(
    db: Session,
    content: str,
    source: Optional[str] = None,
    category: Optional[str] = None
) -> KnowledgeItem:
    """
    Add a new piece of knowledge to the database.
    Automatically generates and stores the embedding.
    
    Args:
        db: Database session
        content: The text content to store
        source: Optional source description
        category: Optional category
        
    Returns:
        The created KnowledgeItem
    """
    logger.info(f"Adding knowledge item: {content[:50]}...")
    
    # Generate embedding
    embedding = await generate_embedding(content)
    
    item = KnowledgeItem(
        content=content,
        source=source,
        category=category,
        embedding=embedding  # SQLAlchemy will serialize this to JSON
    )
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return item

async def search_knowledge(
    db: Session,
    query: str,
    limit: int = 3,
    min_similarity: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Search the knowledge base for relevant content using vector similarity.
    
    Args:
        db: Database session
        query: Search query text
        limit: Max results to return
        min_similarity: Minimum cosine similarity score (0-1)
        
    Returns:
        List of results with keys: item (KnowledgeItem fields), score (float)
    """
    logger.info(f"Searching knowledge base for: {query}")
    
    # Generate query embedding
    query_embedding = await generate_embedding(query)
    
    # Fetch all knowledge items with embeddings
    # Note: For large datasets, this should use a real vector DB (pgvector, chroma, etc.)
    # For this internal tool, in-memory comparison is acceptable.
    items = db.query(KnowledgeItem).filter(KnowledgeItem.embedding.isnot(None)).all()
    
    scored_results = []
    
    for item in items:
        # Load embedding from JSON if needed (SQLAlchemy handles JSON type automatically usually,
        # but safely handling list conversion)
        item_embedding = item.embedding
        if not item_embedding:
            continue
            
        score = cosine_similarity(query_embedding, item_embedding)
        
        if score >= min_similarity:
            scored_results.append({
                "id": item.id,
                "content": item.content,
                "source": item.source,
                "category": item.category,
                "score": score
            })
    
    # Sort by score descending
    scored_results.sort(key=lambda x: x["score"], reverse=True)
    
    return scored_results[:limit]

def list_knowledge_items(db: Session, limit: int = 100) -> List[KnowledgeItem]:
    """List all knowledge items."""
    return db.query(KnowledgeItem).order_by(KnowledgeItem.created_at.desc()).limit(limit).all()

def delete_knowledge_item(db: Session, item_id: int) -> bool:
    """Delete a knowledge item by ID."""
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
        return True
    return False
