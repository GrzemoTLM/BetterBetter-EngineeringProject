import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')

import django
django.setup()

from coupons.models.discipline import Discipline, DisciplineCategory


# Lista dyscyplin sportowych
DISCIPLINES = [
    # Team sports - Sporty drużynowe
    {"code": "SOC", "name": "Piłka nożna", "category": DisciplineCategory.TEAM},
    {"code": "BASK", "name": "Koszykówka", "category": DisciplineCategory.TEAM},
    {"code": "VOLL", "name": "Siatkówka", "category": DisciplineCategory.TEAM},
    {"code": "HAND", "name": "Piłka ręczna", "category": DisciplineCategory.TEAM},
    {"code": "HOCK", "name": "Hokej na lodzie", "category": DisciplineCategory.TEAM},
    {"code": "AMFB", "name": "Futbol amerykański", "category": DisciplineCategory.TEAM},
    {"code": "RUGU", "name": "Rugby", "category": DisciplineCategory.TEAM},
    {"code": "BASE", "name": "Baseball", "category": DisciplineCategory.TEAM},
    {"code": "Wpolo", "name": "Piłka wodna", "category": DisciplineCategory.TEAM},
    {"code": "FUTS", "name": "Futsal", "category": DisciplineCategory.TEAM},
    {"code": "BEAV", "name": "Siatkówka plażowa", "category": DisciplineCategory.TEAM},
    {"code": "FHOC", "name": "Hokej na trawie", "category": DisciplineCategory.TEAM},
    {"code": "CRIC", "name": "Krykiet", "category": DisciplineCategory.TEAM},
    {"code": "FLRB", "name": "Floorball", "category": DisciplineCategory.TEAM},
    {"code": "BNDY", "name": "Bandy", "category": DisciplineCategory.TEAM},

    # Racket sports - Sporty rakietowe
    {"code": "TEN", "name": "Tenis", "category": DisciplineCategory.RACKET},
    {"code": "TABL", "name": "Tenis stołowy", "category": DisciplineCategory.RACKET},
    {"code": "BADM", "name": "Badminton", "category": DisciplineCategory.RACKET},
    {"code": "SQSH", "name": "Squash", "category": DisciplineCategory.RACKET},
    {"code": "PADL", "name": "Padel", "category": DisciplineCategory.RACKET},

    # Combat sports - Sporty walki
    {"code": "BOX", "name": "Boks", "category": DisciplineCategory.COMBAT},
    {"code": "MMA", "name": "MMA", "category": DisciplineCategory.COMBAT},
    {"code": "WRES", "name": "Zapasy", "category": DisciplineCategory.COMBAT},
    {"code": "JUDO", "name": "Judo", "category": DisciplineCategory.COMBAT},
    {"code": "KICK", "name": "Kickboxing", "category": DisciplineCategory.COMBAT},
    {"code": "KARA", "name": "Karate", "category": DisciplineCategory.COMBAT},
    {"code": "TAEK", "name": "Taekwondo", "category": DisciplineCategory.COMBAT},
    {"code": "FENK", "name": "Szermierka", "category": DisciplineCategory.COMBAT},

    # Precision sports - Sporty precyzyjne
    {"code": "GOLF", "name": "Golf", "category": DisciplineCategory.PRECISION},
    {"code": "DART", "name": "Rzutki", "category": DisciplineCategory.PRECISION},
    {"code": "ARCH", "name": "Łucznictwo", "category": DisciplineCategory.PRECISION},
    {"code": "BOWL", "name": "Kręgle", "category": DisciplineCategory.PRECISION},
    {"code": "CURL", "name": "Curling", "category": DisciplineCategory.PRECISION},
    {"code": "SHOO", "name": "Strzelectwo", "category": DisciplineCategory.PRECISION},

    # Motorsport - Sporty motorowe
    {"code": "F1", "name": "Formuła 1", "category": DisciplineCategory.MOTOR},
    {"code": "MOTO", "name": "MotoGP", "category": DisciplineCategory.MOTOR},
    {"code": "RALL", "name": "Rajdy samochodowe", "category": DisciplineCategory.MOTOR},
    {"code": "NASCAR", "name": "NASCAR", "category": DisciplineCategory.MOTOR},
    {"code": "SPWAY", "name": "Żużel", "category": DisciplineCategory.MOTOR},
    {"code": "DTCAR", "name": "DTM", "category": DisciplineCategory.MOTOR},
    {"code": "INDY", "name": "IndyCar", "category": DisciplineCategory.MOTOR},
    {"code": "WRC", "name": "WRC", "category": DisciplineCategory.MOTOR},

    # Endurance sports - Sporty wytrzymałościowe
    {"code": "CYCL", "name": "Kolarstwo", "category": DisciplineCategory.ENDURANCE},
    {"code": "ATHL", "name": "Lekkoatletyka", "category": DisciplineCategory.ENDURANCE},
    {"code": "SWIM", "name": "Pływanie", "category": DisciplineCategory.ENDURANCE},
    {"code": "SKIA", "name": "Narciarstwo alpejskie", "category": DisciplineCategory.ENDURANCE},
    {"code": "SKIC", "name": "Biegi narciarskie", "category": DisciplineCategory.ENDURANCE},
    {"code": "BIAT", "name": "Biathlon", "category": DisciplineCategory.ENDURANCE},
    {"code": "SKIJ", "name": "Skoki narciarskie", "category": DisciplineCategory.ENDURANCE},
    {"code": "SKAT", "name": "Łyżwiarstwo", "category": DisciplineCategory.ENDURANCE},
    {"code": "TRIA", "name": "Triathlon", "category": DisciplineCategory.ENDURANCE},
    {"code": "SLSB", "name": "Snowboard", "category": DisciplineCategory.ENDURANCE},
    {"code": "BOBS", "name": "Bobsleje", "category": DisciplineCategory.ENDURANCE},
    {"code": "LUGE", "name": "Saneczkarstwo", "category": DisciplineCategory.ENDURANCE},

    # Cue sports - Sporty bilardowe
    {"code": "SNOK", "name": "Snooker", "category": DisciplineCategory.CUE},
    {"code": "POOL", "name": "Bilard", "category": DisciplineCategory.CUE},

    # Esports - Sporty elektroniczne
    {"code": "LOL", "name": "League of Legends", "category": DisciplineCategory.ESPORT},
    {"code": "CS2", "name": "Counter-Strike 2", "category": DisciplineCategory.ESPORT},
    {"code": "DOTA", "name": "Dota 2", "category": DisciplineCategory.ESPORT},
    {"code": "VALO", "name": "Valorant", "category": DisciplineCategory.ESPORT},
    {"code": "OWAT", "name": "Overwatch 2", "category": DisciplineCategory.ESPORT},
    {"code": "RLKT", "name": "Rocket League", "category": DisciplineCategory.ESPORT},
    {"code": "FIFA", "name": "EA Sports FC", "category": DisciplineCategory.ESPORT},
    {"code": "COD", "name": "Call of Duty", "category": DisciplineCategory.ESPORT},
    {"code": "R6S", "name": "Rainbow Six Siege", "category": DisciplineCategory.ESPORT},
    {"code": "APEX", "name": "Apex Legends", "category": DisciplineCategory.ESPORT},
    {"code": "PUBG", "name": "PUBG", "category": DisciplineCategory.ESPORT},
    {"code": "FORT", "name": "Fortnite", "category": DisciplineCategory.ESPORT},
    {"code": "SC2", "name": "StarCraft II", "category": DisciplineCategory.ESPORT},
    {"code": "HOTS", "name": "Heroes of the Storm", "category": DisciplineCategory.ESPORT},
    {"code": "WOW", "name": "World of Warcraft", "category": DisciplineCategory.ESPORT},
    {"code": "HSTN", "name": "Hearthstone", "category": DisciplineCategory.ESPORT},
    {"code": "KOG", "name": "King of Glory", "category": DisciplineCategory.ESPORT},
    {"code": "MLBB", "name": "Mobile Legends", "category": DisciplineCategory.ESPORT},
    {"code": "WZON", "name": "Warzone", "category": DisciplineCategory.ESPORT},
    {"code": "TFT", "name": "Teamfight Tactics", "category": DisciplineCategory.ESPORT},

    # Other - Inne
    {"code": "CHES", "name": "Szachy", "category": DisciplineCategory.OTHER},
    {"code": "HORS", "name": "Wyścigi konne", "category": DisciplineCategory.OTHER},
    {"code": "GREY", "name": "Wyścigi chartów", "category": DisciplineCategory.OTHER},
    {"code": "SURF", "name": "Surfing", "category": DisciplineCategory.OTHER},
    {"code": "SAIL", "name": "Żeglarstwo", "category": DisciplineCategory.OTHER},
    {"code": "WLFT", "name": "Podnoszenie ciężarów", "category": DisciplineCategory.OTHER},
    {"code": "GYMN", "name": "Gimnastyka", "category": DisciplineCategory.OTHER},
]


def seed_disciplines():
    """
    Seed the database with sports and esports disciplines.
    Uses update_or_create to avoid duplicates.
    """
    created_count = 0
    updated_count = 0

    for discipline_data in DISCIPLINES:
        discipline, created = Discipline.objects.update_or_create(
            code=discipline_data["code"],
            defaults={
                "name": discipline_data["name"],
                "category": discipline_data["category"],
                "is_active": True,
            }
        )

        if created:
            created_count += 1
            print(f"✅ Created: {discipline.code} - {discipline.name} ({discipline.category})")
        else:
            updated_count += 1
            print(f"🔄 Updated: {discipline.code} - {discipline.name} ({discipline.category})")

    # Podsumowanie po kategoriach
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   - Created: {created_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total: {len(DISCIPLINES)}")
    print(f"\n📂 By category:")
    
    for category in DisciplineCategory:
        count = sum(1 for d in DISCIPLINES if d["category"] == category)
        if count > 0:
            print(f"   - {category.label}: {count}")
    
    print(f"{'='*60}")


if __name__ == "__main__":
    print("🚀 Seeding sports and esports disciplines...")
    print("="*60)
    seed_disciplines()
    print("\n✅ Done!")

