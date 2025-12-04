
import os
import sys

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')

import django
django.setup()

from tickets.models import TicketCategory


# Lista kategorii ticketów
TICKET_CATEGORIES = [
    {
        "name": "bug",
        "description": "Zgłoszenia błędów w działaniu aplikacji - problemy techniczne, nieoczekiwane zachowania systemu, awarie funkcji."
    },
    {
        "name": "feature_request",
        "description": "Propozycje nowych funkcji i ulepszeń - sugestie rozwoju aplikacji, pomysły na nowe możliwości."
    },
    {
        "name": "account",
        "description": "Problemy związane z kontem użytkownika - logowanie, rejestracja, zmiana danych, weryfikacja, usunięcie konta."
    },
    {
        "name": "payment",
        "description": "Sprawy związane z płatnościami - wpłaty, wypłaty, problemy z transakcjami, weryfikacja płatności."
    },
    {
        "name": "other",
        "description": "Inne zgłoszenia - pytania ogólne, feedback, sprawy nieprzypisane do pozostałych kategorii."
    },
]


def seed_ticket_categories():
    """
    Seed the database with ticket categories.
    Uses update_or_create to avoid duplicates.
    """
    created_count = 0
    updated_count = 0

    for category_data in TICKET_CATEGORIES:
        category, created = TicketCategory.objects.update_or_create(
            name=category_data["name"],
            defaults={
                "description": category_data["description"],
            }
        )

        if created:
            created_count += 1
            print(f"✅ Created: {category.name} - {category.get_name_display()}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {category.name} - {category.get_name_display()}")

    print(f"\n{'='*50}")
    print(f"📊 Summary:")
    print(f"   - Created: {created_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total: {len(TICKET_CATEGORIES)}")
    print(f"{'='*50}")


if __name__ == "__main__":
    print("🚀 Seeding ticket categories...")
    print("="*50)
    seed_ticket_categories()
    print("\n✅ Done!")

