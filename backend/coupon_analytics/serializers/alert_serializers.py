from rest_framework import serializers
from coupon_analytics.models import AlertRule, AlertEvent


class AlertRuleSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = AlertRule
        fields = [
            'id', 'user', 'analytics_query', 'rule_type', 'metric', 'comparator',
            'threshold_value', 'window_days', 'message', 'is_active',
            'last_triggered_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['last_triggered_at', 'created_at', 'updated_at']

    def validate(self, attrs):
        rule_type = attrs.get('rule_type') or getattr(self.instance, 'rule_type', None)
        metric = (attrs.get('metric') or getattr(self.instance, 'metric', '') or '').lower()
        mapping = {
            AlertRule.RuleType.STREAK_LOSS: 'streak_loss',
            AlertRule.RuleType.YIELD: 'yield',
            AlertRule.RuleType.ROI: 'roi',
            AlertRule.RuleType.LOSS: 'loss',
        }
        expected = mapping.get(rule_type)
        if expected and metric and metric != expected:
            raise serializers.ValidationError({
                'metric': f"Metric should be '{expected}' for rule_type '{rule_type}'."
            })
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('user', None)
        return super().update(instance, validated_data)


class AlertEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertEvent
        fields = [
            'id', 'rule', 'user', 'metric', 'comparator', 'threshold_value',
            'metric_value', 'window_start', 'window_end', 'triggered_at',
            'sent_at', 'message_rendered'
        ]
        read_only_fields = fields
from .alert_serializers import AlertRuleSerializer, AlertEventSerializer

__all__ = [
    'AlertRuleSerializer',
    'AlertEventSerializer',
]

