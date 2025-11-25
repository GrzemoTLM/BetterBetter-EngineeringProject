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
    telegram_auth_code = serializers.SerializerMethodField(read_only=True)
    two_factor_enabled = serializers.BooleanField(required=False)

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
        read_only_fields = ['two_factor_method', 'telegram_auth_code']

    def validate_two_factor_enabled(self, value):
        if value:
            raise serializers.ValidationError('Enable 2FA using dedicated setup flow.')
        return value

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
        for field in [
            'notification_gate', 'notification_gate_ref', 'nickname', 'auto_coupon_payoff',
            'monthly_budget_limit', 'locale', 'date_format', 'preferred_currency',
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
