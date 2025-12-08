"""Script to populate Brand Brain with knowledge from documentation."""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.database import SessionLocal, init_db
from app.services.knowledge_service import add_knowledge_item

# Knowledge chunks extracted from documentation
KNOWLEDGE_CHUNKS = [
    {
        "content": "Unicity is a company focused on making healthy living doable and supporting metabolic health with science-based nutritional products. The distributor creates content focused on health & wellness education and Unicity's metabolic health products.",
        "source": "client-unicity-dad.md",
        "category": "brand"
    },
    {
        "content": "Feel Great System is a simple daily approach combining two key products (Unimate and Balance) with healthy routines to support metabolic health, appetite control, and more stable energy as part of a healthy lifestyle.",
        "source": "client-unicity-dad.md",
        "category": "product"
    },
    {
        "content": "Unimate is a concentrated yerba mate drink used to support focus, mood, and energy, and to help manage appetite as part of a healthy routine. It supports energy, mental clarity, and appetite in general wellness terms.",
        "source": "client-unicity-dad.md",
        "category": "product"
    },
    {
        "content": "Balance is a fiber and nutrient blend designed to slow carbohydrate absorption, support digestion and cholesterol handling, and provide vitamins/minerals as part of healthier eating patterns. Focus on digestion, satiety, and supporting balanced nutrition.",
        "source": "client-unicity-dad.md",
        "category": "product"
    },
    {
        "content": "Mandatory hashtags that MUST appear in EVERY post: #metabolichealth #healthyliving #unicity. These are required and automatically added to every caption.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "compliance"
    },
    {
        "content": "Health disclaimer ALWAYS included at end of caption: 'These products are intended to support a healthy lifestyle. This is not medical advice. Talk to your healthcare provider before making changes to your routine. Results vary.'",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "compliance"
    },
    {
        "content": "Forbidden language - NEVER say: disease claims ('cures diabetes', 'treats condition', 'prevents disease'), guaranteed results ('you will lose 10 pounds'), income promises ('make $X per month', 'join my team'), MLM recruitment ('DM me to learn how to make money').",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "compliance"
    },
    {
        "content": "Approved language - ALWAYS use: 'supports metabolic health', 'helps with energy and focus', 'can make it easier to manage appetite', 'as part of a healthy lifestyle'.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "compliance"
    },
    {
        "content": "TikTok bans MLM promotion. No recruitment language ('join my team'), no income claims or business opportunity mentions. Focus on education, lifestyle, and personal wellness journey.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "platform_rules"
    },
    {
        "content": "Soft CTAs only using 'link in bio' format. Approved: 'If you're curious what I use, the link's in my bio.', 'Want to learn more? Check the link in my bio.' NEVER use direct URLs in captions or hard-selling language.",
        "source": "unicity-social-media-linking-guidelines.md",
        "category": "compliance"
    },
    {
        "content": "Content structure: 1) HOOK (0-3 seconds) - must grab attention immediately using pain points, 2) CONTEXT/EMPATHY (3-8 seconds) - build connection, 3) VALUE STEPS (8-30 seconds) - actionable tips, 4) SOFT CTA (last 3-5 seconds) - link in bio. Target duration: 15-45 seconds.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "content_strategy"
    },
    {
        "content": "Content mix distribution: 60-70% pure value content (education, routines, stories without product mention), 20-30% value + soft product integration (product appears naturally in routine), <10% direct CTA content (still compliant, not MLM-y).",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "content_strategy"
    },
    {
        "content": "Content pillars: Education (~40-50%) - explanations about energy, cravings, habits; Routines & Habits (~20-30%) - morning/evening routines, habit stacks; Story-based (~10-15%) - relatable struggles and feelings; Product Integration (~20-30%) - product shows up inside routine naturally.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "content_strategy"
    },
    {
        "content": "Visual guidelines - HEADLESS ACCOUNT: All shot descriptions EXCLUDE people, faces, and human subjects. Approved: 'coffee cup steam rising morning light', 'healthy breakfast bowl overhead view', 'green smoothie in glass jar'. Forbidden: 'person doing yoga', 'woman holding smoothie', 'man preparing breakfast'.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "visual_style"
    },
    {
        "content": "TikTok SEO optimization: Keyword must appear in 4 places: 1) On-screen text (first 3 seconds), 2) Spoken audio (near start of script), 3) Caption (natural integration), 4) Hashtags (mix of specific + broad). Total hashtags: Core brand hashtags (3) + 1-2 specific + 1-2 broad = 4-7 hashtags per post.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "seo"
    },
    {
        "content": "Series thinking: Create 2-3 recurring series per schedule (e.g., 'Energy Tip Tuesday', 'Evening Reset Routines', 'My 40+ Wellness Check-in'). Series create consistency, help algorithm understand niche, and build viewer loyalty.",
        "source": "UNICITY_BRAND_GUIDELINES_IMPLEMENTATION.md",
        "category": "content_strategy"
    },
    {
        "content": "Profile bio must clearly identify as 'Independent Unicity Distributor'. Builds credibility and trust with audience. Place actual referral links in profile/bio section, not in post captions.",
        "source": "unicity-social-media-linking-guidelines.md",
        "category": "profile_setup"
    },
    {
        "content": "Tone & voice: friendly, educational, calm, supportive - not hypey or aggressive. Language level: ~8th-9th grade reading level; short sentences; avoid jargon. Use 'supporting', 'helping', 'making it easier' rather than 'fixing', 'curing'. Speak like a real person talking to friends/family.",
        "source": "client-unicity-dad.md",
        "category": "brand_voice"
    },
]

async def main():
    """Populate the Brand Brain with documentation knowledge."""
    init_db()
    db = SessionLocal()
    
    try:
        print(f"🧠 Populating Brand Brain with {len(KNOWLEDGE_CHUNKS)} knowledge chunks...\n")
        
        for i, chunk in enumerate(KNOWLEDGE_CHUNKS, 1):
            print(f"[{i}/{len(KNOWLEDGE_CHUNKS)}] Adding: {chunk['content'][:60]}...")
            try:
                await add_knowledge_item(
                    db=db,
                    content=chunk['content'],
                    source=chunk['source'],
                    category=chunk['category']
                )
                print(f"    ✅ Added successfully\n")
            except Exception as e:
                print(f"    ❌ Error: {e}\n")
        
        print("✅ Brand Brain population complete!")
        print("\nKnowledge base now contains:")
        print("  - Brand identity and positioning")
        print("  - Product details (Feel Great, Unimate, Balance)")
        print("  - Compliance rules and forbidden/approved language")
        print("  - Platform rules (TikTok MLM ban, health claims)")
        print("  - Content structure and strategy")
        print("  - SEO optimization guidelines")
        print("  - Visual style guidelines")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
