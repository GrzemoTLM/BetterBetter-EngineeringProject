from rest_framework import serializers
from coupon_analytics.models import UserStrategy


class UserStrategySerializer(serializers.ModelSerializer):

    class Meta:
        model = UserStrategy
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Strategy name cannot be empty.")
        return value.strip()


class UserStrategyDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for user strategy with all fields."""

    class Meta:
        model = UserStrategy
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Strategy name cannot be empty.")
        return value.strip()


