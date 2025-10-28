from __future__ import annotations
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from common.models import Currency

class UserStatus(models.TextChoices):
    ACTIVE = 'active', _('Active')
    INACTIVE = 'inactive', _('Inactive')
    BLOCKED = 'blocked', _('Blocked')
    PENDING = 'pending', _('Pending')
    DELETED = 'deleted', _('Deleted')

class TwoFactorMethod(models.TextChoices):
    SMS = 'sms', _('SMS')
    EMAIL = 'email', _('Email')
    MOBILE_APP = 'mobile_app', _('Mobile App')
    NONE = 'none', _('None')

class NotificationGate(models.TextChoices):
    EMAIL = 'email', _('Email')
    TELEGRAM = 'telegram', _('Telegram')
    NONE = 'none', _('None')


class User(AbstractUser):
    status = models.CharField(max_length=10, choices=UserStatus.choices, default=UserStatus.ACTIVE)
    email = models.EmailField(_('email address'), unique=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['status']),
            models.Index(fields=['registered_at']),
        ]

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
    notification_gate_ref = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_method = models.CharField(
        max_length=10,
        choices=TwoFactorMethod.choices,
        default=TwoFactorMethod.NONE
    )
    two_factor_secret = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'user_settings'

    def __str__(self):
        return f"Settings<{self.user.username}>"
