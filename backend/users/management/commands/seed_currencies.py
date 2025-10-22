from django.core.management.base import BaseCommand
from users.models import Currency

class Command(BaseCommand):
    help = 'Seed currencies'
    def handle(self, *args, **options):
        currencies = [
            ('PLN', 'Polish Złoty', 'zł', 1.00),
            ('USD', 'American Dollar', '$', 4.20),
            ('EUR', 'Euro', '€', 4.50),
        ]
        for currency in currencies:
            code, name, symbol, value = currency
            obj, created = Currency.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'symbol': symbol,
                    'value': value,
                    'is_active': True,
                }
            )
            if created:
                print(f'Created currency: {obj}')
            else:
                print(f'Currency already exists: {obj}')
