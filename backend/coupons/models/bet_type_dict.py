from django.db import models
from .discipline import Discipline


class BetTypeDict(models.Model):
    code = models.CharField(max_length=32, unique=True)
    description = models.CharField(max_length=128)
    disciplines = models.ManyToManyField(Discipline, related_name="bet_types")

    def __str__(self):
        return f"{self.code} - {self.description}"

    class Meta:
        db_table = 'bet_type_dict'
        verbose_name = "Bet Type"
        verbose_name_plural = "Bet Types"
