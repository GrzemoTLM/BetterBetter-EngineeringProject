"""
Report serializers for periodic reports API.
"""
from rest_framework import serializers
from coupon_analytics.models import Report, AnalyticsQuery


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model."""
    query_name = serializers.CharField(source='query.name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id',
            'query',
            'query_name',
            'frequency',
            'is_active',
            'schedule_payload',
            'next_run',
            'delivery_method',
            'delivery_methods',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'query_name']


class ReportDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Report model."""
    query_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id',
            'query',
            'query_details',
            'frequency',
            'is_active',
            'schedule_payload',
            'next_run',
            'delivery_method',
            'delivery_methods',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_query_details(self, obj):
        """Return full query details if exists."""
        if obj.query:
            return {
                'id': obj.query.id,
                'name': obj.query.name,
                'description': getattr(obj.query, 'description', ''),
            }
        return None

