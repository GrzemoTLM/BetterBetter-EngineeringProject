import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings')

import django
django.setup()

from coupons.models.currency import Currency


CURRENCIES = [
    {
        "code": "PLN",
        "name": "Polski złoty",
        "symbol": "zł",
        "value": 1.00,
    },
    {
        "code": "EUR",
        "name": "Euro",
        "symbol": "€",
        "value": 4.32,
    },
    {
        "code": "USD",
        "name": "Dolar amerykański",
        "symbol": "$",
        "value": 4.05,
    },
]


def seed_currencies():
    """
    Seed the database with currencies.
    Uses update_or_create to avoid duplicates.
    """
    created_count = 0
    updated_count = 0

    for currency_data in CURRENCIES:
        currency, created = Currency.objects.update_or_create(
            code=currency_data["code"],
            defaults={
                "name": currency_data["name"],
                "symbol": currency_data["symbol"],
                "value": currency_data["value"],
                "is_active": True,
            }
        )

        if created:
            created_count += 1
            print(f"[CREATED] {currency.code} - {currency.name} ({currency.symbol})")
        else:
            updated_count += 1
            print(f"[UPDATED] {currency.code} - {currency.name} ({currency.symbol})")

    print(f"\n{'='*50}")
    print(f"[SUMMARY]")
    print(f"   - Created: {created_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total: {len(CURRENCIES)}")
    print(f"{'='*50}")


if __name__ == "__main__":
    print("[INFO] Seeding currencies...")
    print("="*50)
    seed_currencies()
    print("\n[DONE]")

