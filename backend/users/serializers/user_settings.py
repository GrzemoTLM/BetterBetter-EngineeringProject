from rest_framework import serializers
from coupons.models import Currency
from ..models import UserSettings, TelegramAuthCode


class UserSettingsSerializer(serializers.ModelSerializer):
    preferred_currency = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Currency.objects.all(),
        allow_null=True,
        required=False,
    )
    telegram_auth_code = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserSettings
        fields = [
            'preferred_currency',
            'nickname',
            'auto_coupon_payoff',
            'monthly_budget_limit',
            'locale',
            'date_format',
            'notification_gate',
            'notification_gate_ref',
            'two_factor_enabled',
            'two_factor_method',
            'telegram_auth_code',
        ]
        read_only_fields = ['two_factor_method', 'two_factor_enabled', 'telegram_auth_code']

    def get_telegram_auth_code(self, obj):
        if obj.notification_gate == 'telegram':
            user = obj.user
            code = TelegramAuthCode.generate_code(user)
            return {
                'code': code,
                'message': 'Wyślij /login KOD do bota na Telegramie'
            }
        return None

    def update(self, instance, validated_data):
        # proste przypisania dla wszystkich możliwych pól
        for field in [
            'notification_gate', 'notification_gate_ref', 'nickname', 'auto_coupon_payoff',
            'monthly_budget_limit', 'locale', 'date_format', 'preferred_currency',
        ]:
            if field in validated_data:
                setattr(instance, field, validated_data.get(field))
        instance.save()
        return instance
