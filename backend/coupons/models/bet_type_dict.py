from django.db import models

class BetTypeDict(models.Model):
    code = models.CharField(max_length=32, unique=True)
    description = models.CharField(max_length=128)

    def __str__(self):
        return self.description

    class Meta:
        verbose_name = "Bet Type"
        verbose_name_plural = "Bet Types"

