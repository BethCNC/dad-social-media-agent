from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database.database import get_db
from app.services import knowledge_service

router = APIRouter()

class KnowledgeItemCreate(BaseModel):
    content: str
    source: Optional[str] = None
    category: Optional[str] = None

class KnowledgeItemResponse(BaseModel):
    id: int
    content: str
    source: Optional[str] = None
    category: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    query: str
    limit: int = 3

class SearchResult(BaseModel):
    id: int
    content: str
    source: Optional[str] = None
    category: Optional[str] = None
    score: float

@router.post("/", response_model=KnowledgeItemResponse)
async def create_knowledge_item(item: KnowledgeItemCreate, db: Session = Depends(get_db)):
    """Add a new knowledge item (text chunk) to the brand brain."""
    try:
        db_item = await knowledge_service.add_knowledge_item(
            db, 
            content=item.content, 
            source=item.source,
            category=item.category
        )
        return db_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[KnowledgeItemResponse])
def list_knowledge_items(db: Session = Depends(get_db)):
    """List all knowledge items."""
    items = knowledge_service.list_knowledge_items(db)
    # Convert dates to strings
    return [
        {
            "id": i.id,
            "content": i.content,
            "source": i.source, 
            "category": i.category,
            "created_at": i.created_at.isoformat()
        } for i in items
    ]

@router.delete("/{item_id}")
def delete_knowledge_item(item_id: int, db: Session = Depends(get_db)):
    """Delete a knowledge item."""
    success = knowledge_service.delete_knowledge_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "success"}

@router.post("/search", response_model=List[SearchResult])
async def search_knowledge(request: SearchRequest, db: Session = Depends(get_db)):
    """Test the RAG retrieval mechanism."""
    try:
        results = await knowledge_service.search_knowledge(
            db, 
            query=request.query, 
            limit=request.limit
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
