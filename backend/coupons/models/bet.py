from django.db import models
from .bet_type_dict import BetTypeDict
from .discipline import Discipline


class Bet(models.Model):
    class BetResult(models.TextChoices):
        WIN = "win", "Win"
        LOST = "lost", "Lost"
        CANCELED = "canceled", "Canceled(settled @1.00)"

    coupon = models.ForeignKey(
        'Coupon',
        on_delete=models.CASCADE,
        related_name='bet',
        related_query_name='coupon this bet belongs to'
    )
    bet_type = models.ForeignKey(
        BetTypeDict,
        null=True,
        on_delete=models.SET_NULL,
        db_index=True
    )
    discipline = models.ForeignKey(
        Discipline,
        null=True,
        on_delete=models.SET_NULL,
        db_index=True
    )
    odds = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Odds for the bet"
    )
    result = models.CharField(
        max_length=10,
        choices=BetResult.choices,
        null=True,
        blank=True,
        help_text="Result of the bet"
    )

    class Meta:
        verbose_name = "Bet"
        verbose_name_plural = "Bets"

    def __str__(self):
        return f"Bet<{self.pk}> • {self.bet_type} • {self.result}"

