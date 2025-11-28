"""Script to populate content database with initial Unicity quotes and templates."""
import json
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.database.database import SessionLocal, init_db
from app.database.content_repository import create_quote, create_template
from app.database.models import ContentQuote, ContentTemplate


def populate_quotes_from_profile(db, profile_path: Path):
    """Extract quotes from client profile JSON."""
    with profile_path.open(encoding="utf-8") as f:
        profile = json.load(f)
    
    quotes = []
    
    # Extract product descriptions
    products = profile.get("products", {})
    for product_key, product_info in products.items():
        label = product_info.get("label", "")
        focus_points = product_info.get("focus", [])
        
        # Create quotes from focus points
        for focus in focus_points:
            quotes.append({
                "quote_text": f"{label}: {focus}",
                "source": f"{label} Product Page",
                "category": "product_benefit",
                "product_reference": product_key
            })
        
        # Create general product benefit quote
        if focus_points:
            quotes.append({
                "quote_text": f"{label} supports {', '.join(focus_points[:2])} as part of a healthy lifestyle.",
                "source": f"{label} Product Description",
                "category": "wellness",
                "product_reference": product_key
            })
    
    # Extract compliance and tone messaging
    tone = profile.get("tone", {})
    quotes.append({
        "quote_text": f"Tone: {tone.get('overall', 'friendly, educational, supportive')}",
        "source": "Client Profile",
        "category": "wellness",
        "product_reference": None
    })
    
    # Extract disclaimers as quotes
    disclaimers = profile.get("disclaimers", {})
    if disclaimers.get("health"):
        quotes.append({
            "quote_text": disclaimers["health"],
            "source": "Unicity Compliance Guidelines",
            "category": "compliance",
            "product_reference": None
        })
    
    return quotes


def populate_manual_quotes(db):
    """Add manually curated Unicity quotes and messaging."""
    manual_quotes = [
        # Feel Great System
        {
            "quote_text": "The Feel Great System combines Unimate and Balance to support metabolic health and make healthy routines more sustainable.",
            "source": "Feel Great System Marketing",
            "category": "product_benefit",
            "product_reference": "feel_great"
        },
        {
            "quote_text": "Support your metabolic health with a simple, science-informed daily routine.",
            "source": "Unicity Brand Messaging",
            "category": "wellness",
            "product_reference": "feel_great"
        },
        {
            "quote_text": "Making healthy living doable in a busy, on-the-go world.",
            "source": "Unicity Brand Positioning",
            "category": "wellness",
            "product_reference": None
        },
        # Energy and Metabolism
        {
            "quote_text": "Support more stable energy throughout the day with better metabolic health habits.",
            "source": "Metabolic Health Education",
            "category": "energy",
            "product_reference": None
        },
        {
            "quote_text": "Small, consistent changes to your routine can support better energy and focus.",
            "source": "Wellness Education",
            "category": "energy",
            "product_reference": None
        },
        {
            "quote_text": "Support your body's natural metabolism with science-informed nutritional products.",
            "source": "Metabolic Health Education",
            "category": "metabolism",
            "product_reference": None
        },
        # Unimate
        {
            "quote_text": "Unimate supports focus, mood, and energy as part of your daily routine.",
            "source": "Unimate Product Page",
            "category": "product_benefit",
            "product_reference": "unimate"
        },
        {
            "quote_text": "A concentrated yerba mate drink that can help manage appetite and support mental clarity.",
            "source": "Unimate Product Description",
            "category": "product_benefit",
            "product_reference": "unimate"
        },
        # Balance
        {
            "quote_text": "Balance provides fiber and nutrients to support digestion and satiety.",
            "source": "Balance Product Page",
            "category": "product_benefit",
            "product_reference": "balance"
        },
        {
            "quote_text": "Support balanced nutrition and slower carbohydrate absorption with Balance.",
            "source": "Balance Product Description",
            "category": "product_benefit",
            "product_reference": "balance"
        },
        # General Wellness
        {
            "quote_text": "Focus on lifestyle + product, not magical fixes. Realistic and sustainable changes.",
            "source": "Compliance Guidelines",
            "category": "wellness",
            "product_reference": None
        },
        {
            "quote_text": "Use language like 'supports', 'helps with', 'can make it easier to' rather than 'fixes' or 'cures'.",
            "source": "Content Guidelines",
            "category": "compliance",
            "product_reference": None
        },
    ]
    
    return manual_quotes


def populate_templates(db):
    """Create content templates for each pillar."""
    templates = [
        # Education Templates
        {
            "title": "Educational Tip - Energy",
            "template_text": "If you struggle with [energy issue], here's what's happening: [simple explanation]. Try this: [habit tip]. [Product mention if relevant] can support this routine.",
            "content_pillar": "education",
            "use_case": "energy_tip"
        },
        {
            "title": "Educational Tip - Metabolism",
            "template_text": "Understanding metabolic health: [simple explanation]. Small changes like [habit] can make a big difference. [Product] supports this approach.",
            "content_pillar": "education",
            "use_case": "metabolism_tip"
        },
        # Routine Templates
        {
            "title": "Morning Routine",
            "template_text": "My morning routine for better energy: [step 1], [step 2], [step 3]. [Product] fits into this routine by [how it helps].",
            "content_pillar": "routine",
            "use_case": "morning_routine"
        },
        {
            "title": "Evening Routine",
            "template_text": "Evening routine that sets up tomorrow's success: [step 1], [step 2]. This helps me [benefit]. [Product] supports this habit.",
            "content_pillar": "routine",
            "use_case": "evening_routine"
        },
        # Story Templates
        {
            "title": "Personal Story - Before/After Feeling",
            "template_text": "I used to [struggle]. Then I started [habit change] and added [product] to my routine. Now I feel [improvement]. Results vary, but this approach works for me.",
            "content_pillar": "story",
            "use_case": "personal_story"
        },
        # Product Integration Templates
        {
            "title": "Product Integration - Soft Mention",
            "template_text": "Here's how I use [product] in my daily routine: [how]. It supports [benefit] as part of my healthy lifestyle. If you're curious, link in bio.",
            "content_pillar": "product_integration",
            "use_case": "product_intro"
        },
    ]
    
    return templates


def main():
    """Main function to populate database."""
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        # Check if database already has content
        existing_quotes = db.query(ContentQuote).count()
        existing_templates = db.query(ContentTemplate).count()
        
        if existing_quotes > 0 or existing_templates > 0:
            print(f"Database already has {existing_quotes} quotes and {existing_templates} templates.")
            response = input("Do you want to add more? (y/n): ")
            if response.lower() != 'y':
                print("Skipping population.")
                return
        
        # Load quotes from profile
        profile_path = Path(__file__).parent.parent / "core" / "client_unicity_profile.json"
        if profile_path.exists():
            print("Loading quotes from client profile...")
            profile_quotes = populate_quotes_from_profile(db, profile_path)
            for quote_data in profile_quotes:
                create_quote(db, **quote_data)
            print(f"Added {len(profile_quotes)} quotes from profile.")
        else:
            print(f"Warning: Profile not found at {profile_path}")
        
        # Add manual quotes
        print("Adding manually curated quotes...")
        manual_quotes = populate_manual_quotes(db)
        for quote_data in manual_quotes:
            create_quote(db, **quote_data)
        print(f"Added {len(manual_quotes)} manual quotes.")
        
        # Add templates
        print("Adding content templates...")
        templates = populate_templates(db)
        for template_data in templates:
            create_template(db, **template_data)
        print(f"Added {len(templates)} templates.")
        
        # Summary
        total_quotes = db.query(ContentQuote).count()
        total_templates = db.query(ContentTemplate).count()
        print(f"\n✓ Database populated successfully!")
        print(f"  - Total quotes: {total_quotes}")
        print(f"  - Total templates: {total_templates}")
        
    except Exception as e:
        print(f"Error populating database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

