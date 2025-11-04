from django.core.management.base import BaseCommand
from django.db import transaction

from coupons.models import Bookmaker


POLISH_BOOKMAKERS = [
    # (name, tax_multiplier)
    ("STS", 0.88),
    ("Fortuna", 0.88),
    ("Betclic", 1.00),
    ("Superbet", 0.88),
    ("TOTALbet", 0.88),
    ("forBET", 0.88),
    ("LV BET", 0.88),
    ("eWinner", 0.88),
    ("ETOTO", 0.88),
    ("Noblebet", 0.88),
    ("PZBuk", 0.88),
    ("BETFAN", 0.88),
    ("Fuksiarz", 0.88),
    ("Go+Bet", 0.88),
    ("Betters", 0.88),
    ("BetX", 0.88),
    ("Milenium", 0.88),
]


class Command(BaseCommand):
    help = "Seeds legal Polish bookmakers into the database (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--only",
            type=str,
            help="Comma-separated list of bookmaker names to seed (case-sensitive). If omitted, seeds all.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        subset = None
        if options.get("only"):
            subset = {s.strip() for s in options["only"].split(",") if s.strip()}

        created = 0
        updated = 0
        for name, tax_multiplier in POLISH_BOOKMAKERS:
            if subset and name not in subset:
                continue
            obj, was_created = Bookmaker.objects.update_or_create(
                name=name,
                defaults={"tax_multiplier": tax_multiplier},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS("Seeding bookmakers finished."))
        self.stdout.write(f"created={created}, updated={updated}")

