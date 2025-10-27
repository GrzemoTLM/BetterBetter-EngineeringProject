from django.db import models
from django.conf import settings
from django.utils import timezone
from common.choices import CouponType

class Bookmaker(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="Bookmaker name, e.g., 'STS'")
    tax_multiplier = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0.88,
        help_text="Tax multiplier for the bookmaker (e.g., 0.88 for 12% tax))"
    )
    def __str__(self):
        return self.name

class Strategy(models.Model):
    name = models.CharField(
        max_length=100,
        help_text="Name of the strategy, e.g. 'Flat Stake', 'Progressive', 'Martingale'"
    )
    def __str__(self):
        return self.name

class Coupon(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coupons'
    )
    bookmaker = models.ForeignKey(
        Bookmaker,
        on_delete=models.CASCADE,
        related_name='coupons'
    )
    def save(self, *args, **kwargs):
        if self.bookmaker:
            self.tax_multiplier = self.bookmaker.tax_multiplier
        super().save(*args, **kwargs)

    strategy = models.ForeignKey(
        'Strategy',
        on_delete=models.SET_NULL,
        related_name='coupons',
        null=True,
        blank=True,
        related_query_name='coupon',
        help_text="The strategy that this coupon should be applied to."
    )
    class CouponStatus(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        WON = "won", "Won"
        LOST = "lost", "Lost"
        CANCELED = "canceled", "Canceled"

    coupon_type = models.CharField(
        max_length=10,
        choices=CouponType.choices,
        default=CouponType.SOLO,
        db_index=True,
    )
    bet_stake = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total stake amount for the coupon"
    )
    multiplier = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Odds multiplier for the coupon"
    )
    status = models.CharField(
        max_length=15,
        choices=CouponStatus.choices,
        default='in_progress',
        help_text="Current status of the coupon"
    )
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Current balance of the coupon"
    )

    def __str__(self):
        label = self.get_coupon_type_display()
        status = self.get_status_display()
        pk = self.pk or "unsaved"
        return f"Coupon<{pk}> • {label} • {status}"

    @property
    def potential_payout(self) -> float:
        return (float(self.bet_stake) * float(self.multiplier) *
                float(self.bookmaker.tax_multiplier)
        )
    # def recalculate_multiplier(self) -> None:
    #     if not self.bet.exists():
    #         self.multiplier = 1.00
    #         return
    #     odds = 1.00
    #     for bet in self.bet.all():
    #         odds *= float(bet.odds)
    #     self.multiplier = round(odds, 2)

class Discipline(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)

class BetTypeDict(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=128)

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