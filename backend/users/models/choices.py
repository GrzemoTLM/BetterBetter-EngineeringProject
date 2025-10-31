from django.db import models
from django.utils.translation import gettext_lazy as _

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
