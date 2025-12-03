from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class DisciplineCategory(models.TextChoices):
    TEAM = "team_sport", "Team sport"
    RACKET = "racket_sport", "Racket sport"
    COMBAT = "combat_sport", "Combat sport"
    PRECISION = "precision_sport", "Precision sport"
    MOTOR = "motorsport", "Motorsport"
    ENDURANCE = "endurance", "Endurance"
    CUE = "cue_sport", "Cue sport"
    ESPORT = "esport", "Esport"
    OTHER = "other", "Other"


class Discipline(models.Model):
    code = models.CharField(
        max_length=12,
        unique=True,
        db_index=True,
        help_text=_("Short, unique code (e.g., SOC, BASK, TEN). Stored in UPPERCASE.")
    )
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_("Sport discipline name (e.g., Football / Soccer).")
    )
    category = models.CharField(
        max_length=32,
        choices=DisciplineCategory.choices,
        default=DisciplineCategory.TEAM,
    )
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    is_active = models.BooleanField(default=True)


    class Meta:
        ordering = ("name",)
        constraints = []
        # CheckConstraint będzie dodana w migracji

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"
