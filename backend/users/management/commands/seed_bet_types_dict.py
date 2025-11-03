from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Seed bet types dictionary'

    def handle(self, *args, **options):
        call_command('seed_dictionaries', only='bettypes')
        self.stdout.write(self.style.SUCCESS('Bet types seeding finished via seed_dictionaries.'))
