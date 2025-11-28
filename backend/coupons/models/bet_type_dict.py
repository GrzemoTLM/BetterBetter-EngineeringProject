from django.db import models
from .discipline import Discipline

class BetTypeDict(models.Model):
    code = models.CharField(max_length=32)
    description = models.CharField(max_length=128)
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name="bet_types")

    def __str__(self):
        return self.description

    class Meta:
        verbose_name = "Bet Type"
        verbose_name_plural = "Bet Types"
        unique_together = ("code", "discipline")
