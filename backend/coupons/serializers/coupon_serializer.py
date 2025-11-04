from decimal import Decimal
from typing import Dict, Any

from rest_framework import serializers
from common.choices import CouponType
from ..models import Coupon, Strategy
from .bet_serializer import BetSerializer, BetCreateSerializer
from common.serializers.fields import UserAwareDateTimeField
from finances.models.bookmaker_account import BookmakerAccountModel

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
    bookmaker_account = serializers.SlugRelatedField(read_only=True, slug_field='id')
    bookmaker = serializers.SlugRelatedField(read_only=True, slug_field='name', source='bookmaker_account.bookmaker')
    currency = serializers.SlugRelatedField(read_only=True, slug_field='code', source='bookmaker_account.currency')
    strategy = serializers.SlugRelatedField(slug_field='code', read_only=True)
    bets = BetSerializer(many=True, read_only=True)
    potential_payout = serializers.FloatField(read_only=True)
    created_at = UserAwareDateTimeField(read_only=True)
    updated_at = UserAwareDateTimeField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id',
            'user',
            'bookmaker_account',
            'bookmaker',
            'currency',
            'strategy',
            'coupon_type',
            'bet_stake',
            'created_at',
            'updated_at',
            'bets',
            'potential_payout',
        ]
        read_only_fields = (
            'id', 'created_at', 'updated_at', 'potential_payout', 'bookmaker', 'currency'
        )

class CouponCreateSerializer(CouponBaseSerializer):

    bookmaker_account = serializers.PrimaryKeyRelatedField(
        queryset=BookmakerAccountModel.objects.all(), required=True
    )
    stake = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)
    strategy = serializers.SlugRelatedField(
        slug_field='code', queryset=Strategy.objects.all(), allow_null=True, required=False
    )
    coupon_type = serializers.ChoiceField(choices=CouponType.choices, required=False)
    multiplier = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, required=False)
    bets = BetCreateSerializer(many=True, write_only=True, required=False)
    placed_at = serializers.DateTimeField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Coupon
        fields = [
            'bookmaker_account',
            'strategy',
            'coupon_type',
            'bet_stake',
            'stake',
            'bets',
            'multiplier',
            'placed_at',
        ]

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        stake = attrs.pop('stake', None)

        if stake is not None and attrs.get('bet_stake') is None:
            attrs['bet_stake'] = stake
        if attrs.get('bet_stake') is None:
            raise serializers.ValidationError({"bet_stake": "This field is required."})
        account: BookmakerAccountModel = attrs.get('bookmaker_account')

        if not account:
            raise serializers.ValidationError({"bookmaker_account": "This field is required."})
        if not user or account.user_id != user.id:
            raise serializers.ValidationError({"bookmaker_account": "Account does not belong to the current user."})
        return attrs

class CouponUpdateSerializer(CouponBaseSerializer):

    bookmaker_account = serializers.PrimaryKeyRelatedField(
        queryset=BookmakerAccountModel.objects.all(), required=False
    )
    strategy = serializers.SlugRelatedField(
        slug_field='code', queryset=Strategy.objects.all(), allow_null=True, required=False
    )
    coupon_type = serializers.ChoiceField(choices=CouponType.choices, required=False)
    bet_stake = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = Coupon
        fields = ['bookmaker_account', 'strategy', 'coupon_type', 'bet_stake', 'multiplier', 'status']
        extra_kwargs = {
            'bookmaker_account': {'required': False},
            'strategy': {'required': False},
            'coupon_type': {'required': False},
            'bet_stake': {'required': False},
            'multiplier': {'required': False},
            'status': {'required': False},
        }

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        account = attrs.get('bookmaker_account')
        if account is not None and (not user or account.user_id != user.id):
            raise serializers.ValidationError({"bookmaker_account": "Account does not belong to the current user."})
        return attrs
