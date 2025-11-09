from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from coupon_analytics.models import AlertRule, AlertEvent
from coupon_analytics.serializers.alert_serializers import AlertRuleSerializer, AlertEventSerializer
from coupon_analytics.services.alert_service import evaluate_alert_rules_for_user


class AlertRuleListCreateView(generics.ListCreateAPIView):
    serializer_class = AlertRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AlertRule.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        metric = serializer.validated_data.get('metric', '').lower()

        # If creating a streak_loss alert rule, deactivate all old ones
        if metric == 'streak_loss':
            AlertRule.objects.filter(
                user=self.request.user,
                metric='streak_loss',
                is_active=True
            ).update(is_active=False)

        serializer.save(user=self.request.user, metric=metric)


class AlertRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AlertRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AlertRule.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        metric = serializer.validated_data.get('metric')
        if metric:
            serializer.validated_data['metric'] = metric.lower()
        serializer.save()


class AlertRuleEvaluateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        rule = AlertRule.objects.filter(pk=pk, user=request.user).first()
        if not rule:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        evaluate_alert_rules_for_user(request.user)
        events = AlertEvent.objects.filter(rule=rule).order_by('-triggered_at')[:10]
        data = AlertEventSerializer(events, many=True).data
        return Response({'evaluated': True, 'events': data}, status=status.HTTP_200_OK)


class AlertEventListView(generics.ListAPIView):
    serializer_class = AlertEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AlertEvent.objects.filter(user=self.request.user).select_related('rule').order_by('-triggered_at')
        rule_id = self.request.query_params.get('rule_id')
        if rule_id:
            qs = qs.filter(rule_id=rule_id)
        unsent = self.request.query_params.get('unsent')
        if unsent in {'1', 'true', 'True'}:
            qs = qs.filter(sent_at__isnull=True)
        return qs
from django.utils.dateparse import parse_datetime, parse_date
from django.utils import timezone as dj_tz
from datetime import datetime, time
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from coupon_analytics.services.analytics_service import get_coupon_analytics_summary

try:
    from drf_yasg.utils import swagger_auto_schema
    from drf_yasg import openapi
except Exception:
    def swagger_auto_schema(*args, **kwargs):
        def _decorator(fn):
            return fn
        return _decorator
    class _Dummy: pass
    openapi = _Dummy()


class CouponAnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _parse_dt(self, raw: str, end_of_day: bool = False):
        if not raw:
            return None
        dt = parse_datetime(raw)
        if dt is not None:
            if dj_tz.is_naive(dt):
                dt = dj_tz.make_aware(dt, dj_tz.get_current_timezone())
            return dt
        d = parse_date(raw)
        if d is not None:
            dt = datetime.combine(d, time.max if end_of_day else time.min)
            return dj_tz.make_aware(dt, dj_tz.get_current_timezone())
        return None

    @swagger_auto_schema(
        operation_description="Return ROI, Yield i statystyki kuponów gracza w zadanym zakresie dat (opcjonalnym).",
        manual_parameters=[
            openapi.Parameter('date_from', openapi.IN_QUERY, description='Data / datetime od (YYYY-MM-DD lub ISO8601)', type=openapi.TYPE_STRING) if hasattr(openapi, 'Parameter') else None,
            openapi.Parameter('date_to', openapi.IN_QUERY, description='Data / datetime do (YYYY-MM-DD lub ISO8601)', type=openapi.TYPE_STRING) if hasattr(openapi, 'Parameter') else None,
        ] if hasattr(openapi, 'Parameter') else None,
        responses={200: 'Analytics summary'}
    )
    def get(self, request):
        date_from_raw = request.query_params.get('date_from')
        date_to_raw = request.query_params.get('date_to')
        date_from = self._parse_dt(date_from_raw, end_of_day=False)
        date_to = self._parse_dt(date_to_raw, end_of_day=True)
        summary = get_coupon_analytics_summary(request.user, date_from=date_from, date_to=date_to)
        return Response(summary, status=status.HTTP_200_OK)

