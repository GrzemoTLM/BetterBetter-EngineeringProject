from rest_framework import serializers
from coupons.models import Currency
from rest_framework import serializers
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
        read_only_fields = ['preferred_currency', 'two_factor_method', 'two_factor_enabled', 'telegram_auth_code']

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
        if 'notification_gate' in validated_data:
            instance.notification_gate = validated_data.get('notification_gate')
        if 'notification_gate_ref' in validated_data:
            instance.notification_gate_ref = validated_data.get('notification_gate_ref')
        if 'nickname' in validated_data:
            instance.nickname = validated_data.get('nickname')
        if 'auto_coupon_payoff' in validated_data:
            instance.auto_coupon_payoff = validated_data.get('auto_coupon_payoff')
        if 'monthly_budget_limit' in validated_data:
            instance.monthly_budget_limit = validated_data.get('monthly_budget_limit')
        if 'locale' in validated_data:
            instance.locale = validated_data.get('locale')
        if 'date_format' in validated_data:
            instance.date_format = validated_data.get('date_format')
        if 'preferred_currency' in validated_data:
            instance.preferred_currency = validated_data.get('preferred_currency')
        
        instance.save()
        return instance

