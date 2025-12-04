from rest_framework import serializers
from coupons.models import Currency, Discipline, BetTypeDict
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
    telegram_connected = serializers.SerializerMethodField(read_only=True)
    two_factor_enabled = serializers.BooleanField(required=False)
    favourite_disciplines = serializers.PrimaryKeyRelatedField(
        queryset=Discipline.objects.all(),
        many=True,
        required=False,
        allow_null=True,
    )
    favourite_bet_types = serializers.PrimaryKeyRelatedField(
        queryset=BetTypeDict.objects.all(),
        many=True,
        required=False,
        allow_null=True,
    )

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
            'telegram_connected',
            'favourite_disciplines',
            'favourite_bet_types',
        ]
        read_only_fields = ['two_factor_method', 'telegram_auth_code', 'telegram_connected']

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
        return None

    def get_telegram_connected(self, obj):
        user = obj.user
        telegram_connected = hasattr(user, 'telegram_profile') and user.telegram_profile is not None
        return telegram_connected

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['favourite_disciplines'] = list(instance.favourite_disciplines.values_list('id', flat=True))
        ret['favourite_bet_types'] = list(instance.favourite_bet_types.values_list('id', flat=True))
        return ret

    def update(self, instance, validated_data):
        if 'predefined_bet_values' in validated_data and validated_data['predefined_bet_values'] is not None:
            validated_data['predefined_bet_values'] = [
                format(v, 'f') if hasattr(v, 'quantize') else str(v)
                for v in validated_data['predefined_bet_values']
            ]

        favourite_disciplines = validated_data.pop('favourite_disciplines', None)
        favourite_bet_types = validated_data.pop('favourite_bet_types', None)

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

        if favourite_disciplines is not None:
            instance.favourite_disciplines.set(favourite_disciplines)
        if favourite_bet_types is not None:
            instance.favourite_bet_types.set(favourite_bet_types)

        return instance
