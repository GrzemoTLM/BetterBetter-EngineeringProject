from rest_framework import serializers
from common.models import Currency
from ..models import UserSettings


class UserSettingsSerializer(serializers.ModelSerializer):
    preferred_currency = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Currency.objects.all(),
        allow_null=True,
        required=False,
    )

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
        ]
        read_only_fields = ['preferred_currency', 'two_factor_method', 'two_factor_enabled']

