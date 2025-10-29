from django.db import models


class Strategy(models.Model):
    name = models.CharField(
        max_length=100,
        help_text="Name of the strategy, e.g. 'Flat Stake', 'Progressive', 'Martingale'"
    )

    def __str__(self):
        return self.name

