from decimal import Decimal
from typing import Dict, Any, List

from rest_framework import serializers
from common.choices import CouponType
from ..models import Coupon, Bookmaker, Strategy
from .bet_serializer import BetSerializer, BetCreateSerializer
from common.serializers.fields import UserAwareDateTimeField

class CouponBaseSerializer(serializers.ModelSerializer):

    def validate_bet_stake(self, value: Decimal, allow_none: bool = False):
        if allow_none and value is None:
            return value
        if value is None or value <= Decimal('0.00'):
            raise serializers.ValidationError("Bet stake must be a positive value.")
        return value

    def validate_multiplier(self, value: Decimal):
        if value is not None and value <= 1:
            raise serializers.ValidationError("multiplier must be > 1.00.")
        return value

class CouponSerializer(serializers.ModelSerializer):

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    bookmaker = serializers.SlugRelatedField(
        slug_field='code',
        read_only=True
    )
    strategy = serializers.SlugRelatedField(
        slug_field='code',
        read_only=True
    )
    bets = BetSerializer(many=True, read_only=True)
    potential_payout = serializers.FloatField(read_only=True)
    created_at = UserAwareDateTimeField(read_only=True)
    updated_at = UserAwareDateTimeField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id',
            'user',
            'bookmaker',
            'strategy',
            'coupon_type',
            'bet_stake',
            'created_at',
            'updated_at',
            'bets',
            'potential_payout',
        ]
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'potential_payout',
        )

class CouponCreateSerializer(CouponBaseSerializer):

    bookmaker = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Bookmaker.objects.all()
    )
    strategy = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Strategy.objects.all(),
        allow_null=True,
        required=False
    )
    coupon_type = serializers.ChoiceField(
        choices=CouponType.choices,
        required=False
    )
    multiplier = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, required=False)
    bets = BetCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Coupon
        fields = [
            'bookmaker',
            'strategy',
            'coupon_type',
            'bet_stake',
            'bets',
            'multiplier',
        ]

    def validate_created_coupon(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        bets = attrs.get('bets', [])  # type: List[Dict[str, Any]]
        if not bets:
            raise serializers.ValidationError("At least one bet must be provided.")
        return attrs

class CouponUpdateSerializer(CouponBaseSerializer):

    bookmaker = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Bookmaker.objects.all(),
        required=False
    )
    strategy = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Strategy.objects.all(),
        allow_null=True,
        required=False
    )
    coupon_type = serializers.ChoiceField(
        choices=CouponType.choices,
        required=False
    )
    bet_stake = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = Coupon
        fields = ['bookmaker', 'strategy', 'coupon_type', 'bet_stake', 'multiplier', 'status']
        extra_kwargs = {
            'bookmaker': {'required': False},
            'strategy': {'required': False},
            'coupon_type': {'required': False},
            'bet_stake': {'required': False},
            'multiplier': {'required': False},
            'status': {'required': False},
        }
