#!/usr/bin/env python3
"""Script to generate batches of content for the content bank."""
import httpx
import json
import time

API_BASE = "http://localhost:8000/api/content/bank/batch-generate"

batches = [
    {
        "topic_theme": "healthy eating and nutrition tips",
        "content_pillars": ["education", "product_integration"],
        "tone": "friendly",
        "count": 5,
        "min_length_seconds": 20,
        "max_length_seconds": 40,
        "topic_cluster": "nutrition_tips",
        "series_name": "Wellness Wednesday"
    },
    {
        "topic_theme": "evening wind-down and sleep routines",
        "content_pillars": ["routine", "story"],
        "tone": "friendly",
        "count": 5,
        "min_length_seconds": 15,
        "max_length_seconds": 35,
        "topic_cluster": "evening_routine",
        "series_name": "Nighttime Rituals"
    },
    {
        "topic_theme": "fitness and movement tips",
        "content_pillars": ["education", "routine"],
        "tone": "friendly",
        "count": 5,
        "min_length_seconds": 20,
        "max_length_seconds": 45,
        "topic_cluster": "fitness_tips",
        "series_name": "Move More Monday"
    },
    {
        "topic_theme": "stress management and mindfulness",
        "content_pillars": ["story", "education"],
        "tone": "friendly",
        "count": 5,
        "min_length_seconds": 25,
        "max_length_seconds": 45,
        "topic_cluster": "mindfulness",
        "series_name": "Mindful Moments"
    }
]

def generate_batch(batch_config):
    """Generate a batch of content."""
    print(f"\n🚀 Generating batch: {batch_config['series_name']}")
    print(f"   Theme: {batch_config['topic_theme']}")
    print(f"   Count: {batch_config['count']}")

    try:
        with httpx.Client(timeout=300.0) as client:
            response = client.post(API_BASE, json=batch_config)
            response.raise_for_status()
            result = response.json()

            created_ids = result.get("payload_json", {}).get("created_item_ids", [])
            status = result.get("status")

            print(f"   ✅ Status: {status}")
            print(f"   📝 Created {len(created_ids)} items: {created_ids}")

            return result
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("=" * 60)
    print("Content Bank Batch Generation")
    print("=" * 60)

    for i, batch in enumerate(batches, 1):
        print(f"\n[{i}/{len(batches)}]")
        result = generate_batch(batch)
        if i < len(batches):
            print("\n⏳ Waiting 2 seconds before next batch...")
            time.sleep(2)

    print("\n" + "=" * 60)
    print("✅ All batches completed!")
    print("=" * 60)
