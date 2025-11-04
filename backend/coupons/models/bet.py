from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from .bet_type_dict import BetTypeDict
from .discipline import Discipline
from .event import Event


class Bet(models.Model):
    class BetResult(models.TextChoices):
        WIN = "win", "Win"
        LOST = "lost", "Lost"
        CANCELED = "canceled", "Canceled(settled @1.00)"

    coupon = models.ForeignKey(
        'Coupon',
        on_delete=models.CASCADE,
        related_name='bets'
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='bets',
        db_index=True,
        help_text="Related event for this bet"
    )
    event_name = models.CharField(
        max_length=255,
        default='',
        help_text="Event name (e.g., 'Barcelona vs Real Madrid')"
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
    line = models.CharField(
        max_length=50,
        default='',
        help_text="Bet line/selection (e.g., '1', 'X', '2', 'OVER 2.5', 'UNDER 2.5')"
    )
    odds = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('1.01'))],
        help_text="Odds for the bet (must be > 1.00)"
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
