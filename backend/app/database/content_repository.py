"""Repository for content database operations."""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.models import ContentQuote, ContentTemplate


def get_quotes_by_category(
    db: Session,
    category: str,
    product: Optional[str] = None,
    limit: int = 10
) -> List[ContentQuote]:
    """
    Get quotes from database by category and optionally by product.
    
    Args:
        db: Database session
        category: Quote category (e.g., "energy", "metabolism", "wellness")
        product: Optional product reference (e.g., "feel_great", "unimate", "balance")
        limit: Maximum number of quotes to return
        
    Returns:
        List of ContentQuote objects
    """
    query = db.query(ContentQuote).filter(ContentQuote.category == category)
    
    if product:
        query = query.filter(ContentQuote.product_reference == product)
    
    return query.limit(limit).all()


def get_all_quotes(db: Session, limit: int = 50) -> List[ContentQuote]:
    """
    Get all quotes from database.
    
    Args:
        db: Database session
        limit: Maximum number of quotes to return
        
    Returns:
        List of ContentQuote objects
    """
    return db.query(ContentQuote).limit(limit).all()


def get_templates_by_pillar(
    db: Session,
    pillar: str,
    limit: int = 5
) -> List[ContentTemplate]:
    """
    Get content templates by content pillar.
    
    Args:
        db: Database session
        pillar: Content pillar (education, routine, story, product_integration)
        limit: Maximum number of templates to return
        
    Returns:
        List of ContentTemplate objects
    """
    return (
        db.query(ContentTemplate)
        .filter(ContentTemplate.content_pillar == pillar)
        .limit(limit)
        .all()
    )


def create_quote(
    db: Session,
    quote_text: str,
    source: str,
    category: str,
    product_reference: Optional[str] = None
) -> ContentQuote:
    """
    Create a new content quote.
    
    Args:
        db: Database session
        quote_text: The quote text
        source: Source of the quote
        category: Quote category
        product_reference: Optional product reference
        
    Returns:
        Created ContentQuote object
    """
    quote = ContentQuote(
        quote_text=quote_text,
        source=source,
        category=category,
        product_reference=product_reference
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def create_template(
    db: Session,
    title: str,
    template_text: str,
    content_pillar: str,
    use_case: str
) -> ContentTemplate:
    """
    Create a new content template.
    
    Args:
        db: Database session
        title: Template title
        template_text: Template text content
        content_pillar: Content pillar
        use_case: Use case for the template
        
    Returns:
        Created ContentTemplate object
    """
    template = ContentTemplate(
        title=title,
        template_text=template_text,
        content_pillar=content_pillar,
        use_case=use_case
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

