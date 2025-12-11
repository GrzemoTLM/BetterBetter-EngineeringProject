from django.db import models


class Strategy(models.Model):
    name = models.CharField(
        max_length=100,
        help_text="Name of the strategy, e.g. 'Flat Stake', 'Progressive', 'Martingale'"
    )

    class Meta:
        db_table = 'strategies'
        verbose_name = "Strategy"
        verbose_name_plural = "Strategies"

    def __str__(self):
        return self.name

