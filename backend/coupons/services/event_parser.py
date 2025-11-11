
from coupons.models import Event, Discipline
from django.utils import timezone
from datetime import timedelta


class EventParserService:

    SEPARATORS = ['vs.', 'vs', 'v.', 'v', '-', '–']
    
    @staticmethod
    def parse_teams(event_name: str) -> tuple:

        event_name = event_name.strip()

        for separator in EventParserService.SEPARATORS:
            if separator.lower() in event_name.lower():
                parts = event_name.split(separator)
                if len(parts) == 2:
                    home_team = parts[0].strip()
                    away_team = parts[1].strip()
                    return (home_team, away_team)
        return (None, None)
    
    @staticmethod
    def get_or_create_event(
        event_name: str,
        discipline: Discipline,
        start_time=None
    ) -> tuple:

        if start_time is None:
            start_time = timezone.now() + timedelta(days=1)

        home_team, away_team = EventParserService.parse_teams(event_name)

        event, created = Event.objects.get_or_create(
            name=event_name,
            discipline=discipline,
            defaults={
                'home_team': home_team,
                'away_team': away_team,
                'start_time': start_time,
            }
        )
        if not created and (event.home_team is None or event.away_team is None):
            event.home_team = home_team
            event.away_team = away_team
            event.save()
        
        return event, created

