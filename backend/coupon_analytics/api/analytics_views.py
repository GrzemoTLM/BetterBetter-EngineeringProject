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

