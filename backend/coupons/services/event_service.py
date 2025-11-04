from typing import Dict, Any
from django.db import transaction
from django.db.models import QuerySet

from ..models import Event


class EventService:
    @transaction.atomic
    def create_event(self, *, data: Dict[str, Any]) -> Event:
        return Event.objects.create(**data)

    @transaction.atomic
    def update_event(self, *, event: Event, data: Dict[str, Any]) -> Event:
        for field, value in data.items():
            setattr(event, field, value)
        event.save()
        return event

    @transaction.atomic
    def delete_event(self, *, event: Event) -> None:
        event.delete()

    def get_event(self, *, event_id: int) -> Event:
        return Event.objects.get(id=event_id)

    def list_events(self) -> QuerySet[Event]:
        return Event.objects.select_related("discipline").all()


_service = EventService()

def create_event(data: Dict[str, Any]) -> Event:
    return _service.create_event(data=data)


def update_event(event: Event, data: Dict[str, Any]) -> Event:
    return _service.update_event(event=event, data=data)


def delete_event(event: Event) -> None:
    return _service.delete_event(event=event)


def get_event(event_id: int) -> Event:
    return _service.get_event(event_id=event_id)


def list_events() -> QuerySet[Event]:
    return _service.list_events()

