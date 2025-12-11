from django.conf import settings
from django.db import models

from coupons.models import Currency, Discipline, BetTypeDict
from .choices import NotificationGate


class UserSettings(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_settings',
    )

    preferred_currency = models.ForeignKey(
        Currency, on_delete=models.SET_NULL, null=True, related_name='user_settings'
    )

    nickname = models.CharField(max_length=255, blank=True, null=True)
    auto_coupon_payoff = models.BooleanField(default=False)
    monthly_budget_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True, null=True
    )
    locale = models.CharField(max_length=10, default='en-US')
    date_format = models.CharField(max_length=10, default='DD-MM-YYYY')
    notification_gate = models.CharField(
        max_length=10,
        choices=NotificationGate.choices,
        default=NotificationGate.NONE
    )
    two_factor_enabled = models.BooleanField(default=False)
    predefined_bet_values = models.JSONField(default=list, blank=True)

    favourite_disciplines = models.ManyToManyField(
        Discipline,
        blank=True,
        related_name='user_favourite_settings'
    )

    favourite_bet_types = models.ManyToManyField(
        BetTypeDict,
        blank=True,
        related_name='user_favourite_settings'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_settings'

    def __str__(self):
        return f"Settings<{self.user.username}>"
