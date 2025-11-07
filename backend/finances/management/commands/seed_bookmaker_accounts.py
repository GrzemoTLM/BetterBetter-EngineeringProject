from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from coupons.models.bookmaker import Bookmaker
from coupons.models.currency import Currency
from finances.models import BookmakerAccountModel

BOOKMAKERS_TO_SEED = ["STS", "Fortuna", "Betclic", "BetFan"]
PLN_DEFAULTS = {
    "code": "PLN",
    "name": "Polish Zloty",
    "symbol": "zł",
    "value": 1,
    "is_active": True,
}

class Command(BaseCommand):
    help = "Seed bookmaker accounts (STS, Fortuna, Betclic, BetFan) for user id=2 in an idempotent way"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=int,
            default=2,
            help="User id for whom bookmaker accounts will be created (default: 2)",
        )
        parser.add_argument(
            "--bookmakers",
            nargs="*",
            default=BOOKMAKERS_TO_SEED,
            help="Optional list of bookmaker names to seed",
        )
        parser.add_argument(
            "--currency-code",
            type=str,
            default="PLN",
            help="Currency code to assign to created accounts (default: PLN)",
        )

    def handle(self, *args, **options):
        user_id = options["user_id"]
        bookmaker_names = options["bookmakers"]
        currency_code = options["currency_code"].upper()

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User with id={user_id} does not exist"))
            return

        currency, _ = Currency.objects.get_or_create(code=currency_code, defaults=PLN_DEFAULTS)

        created_accounts = []
        skipped_accounts = []
        created_bookmakers = []

        with transaction.atomic():
            for name in bookmaker_names:
                bookmaker, bm_created = Bookmaker.objects.get_or_create(name=name)
                if bm_created:
                    created_bookmakers.append(name)
                account, acc_created = BookmakerAccountModel.objects.get_or_create(
                    user=user,
                    bookmaker=bookmaker,
                    defaults={"currency": currency}
                )
                if acc_created:
                    created_accounts.append(name)
                else:
                    skipped_accounts.append(name)

        self.stdout.write(self.style.SUCCESS("Seed completed"))
        self.stdout.write(f"User: {user_id}")
        self.stdout.write(f"Currency: {currency.code}")
        if created_bookmakers:
            self.stdout.write(f"New bookmakers created: {', '.join(created_bookmakers)}")
        self.stdout.write(f"Accounts created: {', '.join(created_accounts) if created_accounts else 'None'}")
        self.stdout.write(f"Accounts skipped (already existed): {', '.join(skipped_accounts) if skipped_accounts else 'None'}")

