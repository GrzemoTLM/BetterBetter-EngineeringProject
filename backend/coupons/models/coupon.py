from django.db import models
from django.conf import settings
from django.utils import timezone
from common.choices import CouponType
from .bookmaker import Bookmaker


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
    bookmaker = models.ForeignKey(
        Bookmaker,
        on_delete=models.CASCADE,
        related_name='coupons'
    )
    strategy = models.ForeignKey(
        'Strategy',
        on_delete=models.SET_NULL,
        related_name='coupons',
        null=True,
        blank=True,
        related_query_name='coupon',
        help_text="The strategy that this coupon should be applied to."
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
        if self.bookmaker:
            self.tax_multiplier = self.bookmaker.tax_multiplier
        super().save(*args, **kwargs)

    @property
    def potential_payout(self) -> float:
        return (float(self.bet_stake) * float(self.multiplier) *
                float(self.bookmaker.tax_multiplier)
        )

