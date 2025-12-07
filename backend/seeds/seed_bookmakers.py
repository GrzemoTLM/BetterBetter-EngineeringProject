import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')

import django
django.setup()

from coupons.models.bookmaker import Bookmaker


# Lista wszystkich legalnych polskich bukmacherów
# Podatek od zakładów w Polsce wynosi 12%, więc tax_multiplier = 0.88
POLISH_BOOKMAKERS = [
    {"name": "STS", "tax_multiplier": 0.88},
    {"name": "Fortuna", "tax_multiplier": 0.88},
    {"name": "Betclic", "tax_multiplier": 1.00},
    {"name": "Superbet", "tax_multiplier": 0.88},
    {"name": "LVBET", "tax_multiplier": 0.88},
    {"name": "Betfan", "tax_multiplier": 0.88},
    {"name": "forBET", "tax_multiplier": 0.88},
    {"name": "Fuksiarz", "tax_multiplier": 0.88},
    {"name": "Betters", "tax_multiplier": 0.88},
    {"name": "TOTALbet", "tax_multiplier": 0.88},
    {"name": "ETOTO", "tax_multiplier": 0.88},
    {"name": "Betcris", "tax_multiplier": 0.88},
    {"name": "GoBet", "tax_multiplier": 0.88},
    {"name": "Totolotek", "tax_multiplier": 0.88},
    {"name": "eWinner", "tax_multiplier": 0.88},
    {"name": "ComeOn", "tax_multiplier": 0.88},
    {"name": "Noblebet", "tax_multiplier": 0.88},
    {"name": "PZBuk", "tax_multiplier": 0.88},
    {"name": "Betx", "tax_multiplier": 0.88},
    {"name": "Buckmaker", "tax_multiplier": 0.88},
    {"name": "StarBet", "tax_multiplier": 0.88},
]


def seed_bookmakers():
    """
    Seed the database with Polish bookmakers.
    Uses update_or_create to avoid duplicates.
    """
    created_count = 0
    updated_count = 0
    
    for bookmaker_data in POLISH_BOOKMAKERS:
        bookmaker, created = Bookmaker.objects.update_or_create(
            name=bookmaker_data["name"],
            defaults={"tax_multiplier": bookmaker_data["tax_multiplier"]}
        )
        
        if created:
            created_count += 1
            print(f"✅ Created: {bookmaker.name}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {bookmaker.name}")
    
    print(f"\n{'='*50}")
    print(f"[SUMMARY]")
    print(f"   - Created: {created_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total: {len(POLISH_BOOKMAKERS)}")
    print(f"{'='*50}")


if __name__ == "__main__":
    print("[INFO] Seeding Polish bookmakers...")
    print("="*50)
    seed_bookmakers()
    print("\n[DONE]")

