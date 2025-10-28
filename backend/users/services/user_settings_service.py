from django.contrib.auth import get_user_model
from django.utils.formats import date_format
from ..models import UserSettings, NotificationGate

User = get_user_model()

class UserSettingsService:
    def get_user_settings(self, user: User) -> UserSettings:
        settings, created = UserSettings.objects.get_or_create(user=user)
        return settings

    def update_user_settings(self, user: User, data: dict) -> UserSettings:
        settings = self.get_user_settings(user)
        updatable_fields = [
            'preferred_currency',
            'notification_gate',
            'notification_gate_ref',
            'nickname',
            'locale',
            'date_format',
            'monthly_budget_limit',
            'auto_coupon_payoff',
        ]
        for field in updatable_fields:
            if field in data:
                setattr(settings, field, data[field])

        if settings.notification_gate == NotificationGate.NONE:
            settings.notification_gate_ref = None

        settings.save()
        return settings

_service = UserSettingsService()


def get_user_settings(user: User) -> UserSettings:
    return _service.get_user_settings(user)


def update_user_settings(user: User, data: dict) -> UserSettings:
    return _service.update_user_settings(user, data)
