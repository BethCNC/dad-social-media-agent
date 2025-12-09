"""Batch generate content for the Content Bank.

This script generates multiple posts in parallel and saves them to the content bank.
Use this to pre-populate content so the user doesn't wait for generation.

Usage:
    python -m app.scripts.batch_populate_bank --count 20
"""
import asyncio
import argparse
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.database import SessionLocal, init_db
from app.database.models import ContentBankItem
from app.services.gemini_client import generate_content_plan_gemini
from app.models.content import ContentBrief

# Pre-defined topics that are always relevant for Unicity/wellness
WELLNESS_TOPICS = [
    "3 simple morning habits for stable energy",
    "How I manage afternoon energy crashes without coffee",
    "Simple evening routine for better sleep",
    "The mistake everyone makes with breakfast timing",
    "What I learned about intermittent fasting after 40",
    "My favorite healthy snack that actually works",
    "5-minute morning routine for metabolic health",
    "The truth about energy crashes nobody talks about",
    "How to stay consistent with healthy habits",
    "What changed when I started tracking my eating window",
    "Simple hydration tip for more energy",
    "Why I changed my morning coffee routine",
    "The one habit that improved my focus",
    "How to meal prep without feeling overwhelmed",
    "What I wish I knew about metabolism earlier",
    "Simple way to support digestive health",
    "My go-to routine for busy mornings",
    "How to make healthy eating doable",
    "The routine that helps me sleep better",
    "What finally worked for managing cravings",
]


async def generate_single_post(topic: str, db) -> dict:
    """Generate a single content bank item."""
    try:
        print(f"  → Generating: {topic[:50]}...")
        
        brief = ContentBrief(
            user_topic=topic,
            tone="friendly",
            platforms=["TikTok", "Instagram"],
            mode="manual",
            template_type="video",
        )
        
        plan = await generate_content_plan_gemini(brief)
        
        # Extract content pillar from topic
        pillar = "education"  # Default
        if "routine" in topic.lower() or "habit" in topic.lower():
            pillar = "routine"
        elif "story" in topic.lower() or "changed" in topic.lower() or "learned" in topic.lower():
            pillar = "story"
        
        # Save to database
        item = ContentBankItem(
            title=topic[:100],  # First 100 chars as title
            script=plan.script,
            caption=plan.caption,
            content_pillar=pillar,
            tone="friendly",
            status="approved",  # Ready to use
            created_from="ai_batch",
            created_at=datetime.utcnow()
        )
        db.add(item)
        db.commit()
        
        print(f"  ✅ Saved: {topic[:50]}")
        return {"success": True, "topic": topic}
        
    except Exception as e:
        print(f"  ❌ Failed: {topic[:50]} - {e}")
        return {"success": False, "topic": topic, "error": str(e)}


async def batch_generate(count: int = 20, parallel: int = 3):
    """
    Generate multiple posts in parallel batches.
    
    Args:
        count: Number of posts to generate
        parallel: How many to generate at once (higher = faster but more API load)
    """
    init_db()
    
    print(f"\n🎬 Batch Content Generation Starting...")
    print(f"   Target: {count} posts")
    print(f"   Parallel: {parallel} at a time")
    print(f"   Model: gemini-2.0-flash-exp")
    print("=" * 60)
    
    # Select topics
    topics = WELLNESS_TOPICS[:count]
    
    # Generate in batches
    results = []
    for i in range(0, len(topics), parallel):
        batch = topics[i:i+parallel]
        batch_num = (i // parallel) + 1
        total_batches = (len(topics) + parallel - 1) // parallel
        
        print(f"\n📦 Batch {batch_num}/{total_batches} ({len(batch)} posts)")
        
        db = SessionLocal()
        try:
            tasks = [generate_single_post(topic, db) for topic in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend(batch_results)
        finally:
            db.close()
        
        # Brief pause between batches to avoid rate limits
        if i + parallel < len(topics):
            await asyncio.sleep(2)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Generation Summary:")
    successful = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
    failed = len(results) - successful
    print(f"   ✅ Successful: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Success Rate: {(successful/len(results)*100):.1f}%")
    print("=" * 60)
    
    if failed > 0:
        print("\n❌ Failed topics:")
        for r in results:
            if isinstance(r, dict) and not r.get("success"):
                print(f"   - {r['topic']}: {r.get('error', 'Unknown error')}")


def main():
    parser = argparse.ArgumentParser(description="Batch generate content for Content Bank")
    parser.add_argument(
        "--count",
        type=int,
        default=20,
        help="Number of posts to generate (default: 20, max: 20)",
    )
    parser.add_argument(
        "--parallel",
        type=int,
        default=3,
        help="How many to generate at once (default: 3, recommended: 2-5)",
    )
    
    args = parser.parse_args()
    
    # Cap at available topics
    count = min(args.count, len(WELLNESS_TOPICS))
    
    asyncio.run(batch_generate(count, args.parallel))
    
    print("\n✨ Done! Check your Content Bank in the app.")


if __name__ == "__main__":
    main()
