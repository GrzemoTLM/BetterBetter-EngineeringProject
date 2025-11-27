from rest_framework import serializers
from coupons.models import Currency
from ..models import UserSettings, TelegramAuthCode
from ..models.choices import TwoFactorMethod
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.plugins.otp_email.models import EmailDevice


class UserSettingsSerializer(serializers.ModelSerializer):
    preferred_currency = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Currency.objects.all(),
        allow_null=True,
        required=False,
    )
    basic_currency = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Currency.objects.all(),
        allow_null=True,
        required=False,
        write_only=True,
    )
    predefined_bet_values = serializers.ListField(
        child=serializers.DecimalField(max_digits=10, decimal_places=2),
        required=False,
        allow_empty=True,
    )
    telegram_auth_code = serializers.SerializerMethodField(read_only=True)
    two_factor_enabled = serializers.BooleanField(required=False)

    class Meta:
        model = UserSettings
        fields = [
            'preferred_currency',
            'basic_currency',
            'predefined_bet_values',
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
        read_only_fields = ['two_factor_method', 'telegram_auth_code']

    def validate_two_factor_enabled(self, value):
        if value:
            raise serializers.ValidationError('Enable 2FA using dedicated setup flow.')
        return value

    def validate(self, attrs):
        if 'basic_currency' in attrs and 'preferred_currency' not in attrs:
            attrs['preferred_currency'] = attrs['basic_currency']
        elif 'basic_currency' in attrs and 'preferred_currency' in attrs:
            if attrs['basic_currency'] != attrs['preferred_currency']:
                attrs['preferred_currency'] = attrs['basic_currency']
        return attrs

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
        if 'predefined_bet_values' in validated_data and validated_data['predefined_bet_values'] is not None:
            validated_data['predefined_bet_values'] = [
                format(v, 'f') if hasattr(v, 'quantize') else str(v)
                for v in validated_data['predefined_bet_values']
            ]

        for field in [
            'notification_gate', 'notification_gate_ref', 'nickname', 'auto_coupon_payoff',
            'monthly_budget_limit', 'locale', 'date_format', 'preferred_currency', 'predefined_bet_values'
        ]:
            if field in validated_data:
                setattr(instance, field, validated_data.get(field))
        if 'two_factor_enabled' in validated_data and validated_data['two_factor_enabled'] is False:
            if instance.two_factor_enabled:
                EmailDevice.objects.filter(user=instance.user).delete()
                TOTPDevice.objects.filter(user=instance.user).delete()
                instance.two_factor_enabled = False
                instance.two_factor_method = TwoFactorMethod.NONE
                instance.two_factor_secret = None
        instance.save()
        return instance
