from django.contrib.auth import get_user_model
from ..models import UserSettings, NotificationGate
from django_otp.plugins.otp_totp.models import TOTPDevice

User = get_user_model()

class UserSettingsService:
    def get_user_settings(self, user: User) -> UserSettings:
        settings, created = UserSettings.objects.get_or_create(user=user)
        return settings

    def update_user_settings(self, user: User, data: dict) -> UserSettings:
        settings = self.get_user_settings(user)

        if 'predefined_bet_values' in data and data['predefined_bet_values'] is not None:
            data['predefined_bet_values'] = [
                format(v, 'f') if hasattr(v, 'quantize') else str(v)
                for v in data['predefined_bet_values']
            ]


        favourite_disciplines = data.pop('favourite_disciplines', None)
        favourite_bet_types = data.pop('favourite_bet_types', None)

        updatable_fields = [
            'preferred_currency',
            'notification_gate',
            'nickname',
            'locale',
            'date_format',
            'monthly_budget_limit',
            'auto_coupon_payoff',
            'two_factor_enabled',
            'predefined_bet_values'
        ]
        for field in updatable_fields:
            if field in data:
                setattr(settings, field, data[field])

        if 'two_factor_enabled' in data and data['two_factor_enabled'] is False and settings.two_factor_enabled:
            TOTPDevice.objects.filter(user=user).delete()
            settings.two_factor_enabled = False


        settings.save()

        if favourite_disciplines is not None:
            settings.favourite_disciplines.set(favourite_disciplines)
        if favourite_bet_types is not None:
            settings.favourite_bet_types.set(favourite_bet_types)

        return settings

_service = UserSettingsService()


def get_user_settings(user: User) -> UserSettings:
    return _service.get_user_settings(user)


def update_user_settings(user: User, data: dict) -> UserSettings:
    return _service.update_user_settings(user, data)
