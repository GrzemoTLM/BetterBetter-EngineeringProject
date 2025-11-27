from django.db import models
from django.conf import settings
from django.utils import timezone
from common.choices import CouponType
from decimal import Decimal, ROUND_HALF_UP


class Coupon(models.Model):
    class CouponStatus(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        WON = "won", "Won"
        LOST = "lost", "Lost"
        CANCELED = "canceled", "Canceled"

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coupons'
    )
    bookmaker_account = models.ForeignKey(
        'finances.BookmakerAccountModel',
        on_delete=models.PROTECT,
        related_name='coupons',
        null=True,
        blank=True,
    )
    strategy = models.ForeignKey(
        'coupon_analytics.UserStrategy',
        on_delete=models.SET_NULL,
        related_name='coupons',
        null=True,
        blank=True,
        related_query_name='coupon',
        help_text="User-defined strategy associated with this coupon."
    )
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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    @property
    def potential_payout(self) -> float:
        try:
            tax_mult = Decimal(str(self.bookmaker_account.bookmaker.tax_multiplier))
            currency_code = getattr(self.bookmaker_account.currency, 'code', None)
        except Exception:
            tax_mult = Decimal('1.00')
            currency_code = None

        bet_stake = Decimal(str(self.bet_stake))
        multiplier = Decimal(str(self.multiplier))
        gross = bet_stake * multiplier * tax_mult

        if currency_code == 'PLN' and gross > Decimal('2280.00'):
            gross = gross * (Decimal('1.00') - Decimal('0.10'))

        return float(gross.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
