from rest_framework import serializers
from coupon_analytics.models.queries import AnalyticsQuery, AnalyticsQueryGroup, AnalyticsQueryCondition
from coupons.models import Coupon


class AnalyticsQueryConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsQueryCondition
        fields = ['field', 'operator', 'value', 'negate', 'order']


class AnalyticsQueryGroupSerializer(serializers.ModelSerializer):
    conditions = AnalyticsQueryConditionSerializer(many=True, read_only=True)
    subgroups = serializers.SerializerMethodField()

    class Meta:
        model = AnalyticsQueryGroup
        fields = ['id', 'operator', 'order', 'conditions', 'subgroups']

    def get_subgroups(self, obj):
        subgroups = obj.subgroups.all().order_by('order')
        return AnalyticsQueryGroupSerializer(subgroups, many=True).data


class AnalyticsQuerySerializer(serializers.ModelSerializer):
    query_groups = AnalyticsQueryGroupSerializer(many=True, read_only=True)

    class Meta:
        model = AnalyticsQuery
        fields = ['id', 'name', 'start_date', 'end_date', 'bookmaker', 'statuses', 
                  'coupon_type', 'sort_by', 'query_groups']


class CouponFilterResponseSerializer(serializers.ModelSerializer):
    """Serializer do wyświetlania wyników filtrowania kuponów"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    coupon_type_display = serializers.CharField(source='get_coupon_type_display', read_only=True)
    bookmaker_name = serializers.CharField(source='bookmaker_account.bookmaker.name', read_only=True)
    currency_code = serializers.CharField(source='bookmaker_account.currency.code', read_only=True)
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'created_at', 'status', 'status_display', 'coupon_type', 'coupon_type_display',
            'bet_stake', 'multiplier', 'balance', 'bookmaker_name', 'currency_code'
        ]


class SimpleFilterRequestSerializer(serializers.Serializer):
    """Serializer do prostych zapytań filtrujących bez QueryBuilder"""
    team_name = serializers.CharField(required=False, allow_blank=True, help_text="Nazwa drużyny (np. Barcelona)")
    position = serializers.ChoiceField(
        choices=['home', 'away', 'any'], 
        required=False, 
        default='any',
        help_text="home, away, lub any"
    )
    bet_type = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="Kod typu zakładu (1, 2, X, BTTS)"
    )
    only_won = serializers.BooleanField(default=True, help_text="Tylko wygrane kupony")
    status = serializers.ChoiceField(
        choices=['won', 'lost', 'in_progress', 'canceled', 'any'],
        required=False,
        default='any'
    )


class QueryBuilderRequestSerializer(serializers.Serializer):
    """Serializer do przesyłania QueryBuilder zapytań"""
    name = serializers.CharField(required=False, allow_blank=True, help_text="Nazwa zapytania")
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    conditions = serializers.JSONField(
        help_text="Warunki filtrowania w formacie JSON"
    )
    # Example:
    # {
    #   "conditions": [
    #     {"field": "status", "operator": "equals", "value": "won"},
    #     {"field": "coupon_type", "operator": "equals", "value": "single"}
    #   ]
    # }

