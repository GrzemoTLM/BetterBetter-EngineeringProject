from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .discipline import Discipline

class Event(models.Model):
    class EventStatus(models.TextChoices):
        SCHEDULED = "scheduled", _("Scheduled")
        LIVE = "live", _("Live")
        COMPLETED = "completed", _("Completed")
        CANCELED = "canceled", _("Canceled")

    created_at = models.DateTimeField(default=timezone.now, verbose_name=_("Created at"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated at"))

    name = models.CharField(
        max_length=200,
        verbose_name=_("Event name"),
        help_text=_("Name of the event (e.g., Team A vs Team B)"),
    )
    home_team = models.CharField(
        max_length=200,
        verbose_name=_("Home team"),
        help_text=_("Name of the home team"),
        blank=True,
        null=True,
    )
    away_team = models.CharField(
        max_length=200,
        verbose_name=_("Away team"),
        help_text=_("Name of the away team"),
        blank=True,
        null=True,
    )
    discipline = models.ForeignKey(
        Discipline,
        on_delete=models.CASCADE,
        related_name="events",
        verbose_name=_("Discipline"),
    )
    start_time = models.DateTimeField(
        verbose_name=_("Start time"),
        help_text=_("Scheduled start time of the event"),
    )

    class Meta:
        db_table = 'events'
        verbose_name = _("Event")
        verbose_name_plural = _("Events")
        ordering = ("-start_time",)
