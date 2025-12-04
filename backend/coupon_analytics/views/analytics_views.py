from django.utils.dateparse import parse_datetime, parse_date
from django.utils import timezone as dj_tz
from datetime import datetime, time
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from coupon_analytics.services.analytics_service import get_coupon_analytics_summary, get_coupon_analytics_summary_for_queryset
from coupon_analytics.services.query_builder import AnalyticsQueryBuilder
from coupon_analytics.models.queries import AnalyticsQuery
from coupons.serializers.coupon_filter_serializer import AnalyticsQuerySerializer

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


class SavedFilterCreateSerializer:
    pass


from rest_framework import serializers as drf_serializers


class SavedFilterInputSerializer(drf_serializers.Serializer):
    name = drf_serializers.CharField(max_length=255)
    description = drf_serializers.CharField(required=False, allow_blank=True, allow_null=True)
    query_type = drf_serializers.CharField(required=False, default='simple')
    params = drf_serializers.JSONField(required=False, allow_null=True)
    conditions = drf_serializers.JSONField(required=False, allow_null=True)
    logic = drf_serializers.CharField(required=False, allow_null=True)
    group_by = drf_serializers.CharField(required=False, allow_null=True)
    order_by = drf_serializers.CharField(required=False, allow_null=True)
    start_date = drf_serializers.DateField(required=False, allow_null=True)
    end_date = drf_serializers.DateField(required=False, allow_null=True)


class SavedFiltersListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Pobierz listę zapisanych filtrów (AnalyticsQuery) użytkownika.",
        responses={200: AnalyticsQuerySerializer(many=True)}
    )
    def get(self, request):
        queries = AnalyticsQuery.objects.filter(user=request.user).order_by('-id')
        serializer = AnalyticsQuerySerializer(queries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _create_query_from_params(self, user, data):
        from coupon_analytics.models.queries import AnalyticsQueryGroup, AnalyticsQueryCondition

        query = AnalyticsQuery.objects.create(
            user=user,
            name=data.get('name', 'Unnamed Filter'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
        )

        params = data.get('params') or {}
        conditions = data.get('conditions') or []

        if params or conditions:
            group = AnalyticsQueryGroup.objects.create(
                analytics_query=query,
                operator='AND',
                parent=None,
                order=0
            )

            order_idx = 0

            if params:
                team_name = params.get('team_name')
                position = params.get('position', 'any')
                filter_mode = params.get('filter_mode', 'all')
                bet_type_code = params.get('bet_type_code')

                if team_name:
                    if position == 'home':
                        AnalyticsQueryCondition.objects.create(
                            group=group,
                            field='bets__event__home_team',
                            operator='contains',
                            value=team_name,
                            order=order_idx
                        )
                    elif position == 'away':
                        AnalyticsQueryCondition.objects.create(
                            group=group,
                            field='bets__event__away_team',
                            operator='contains',
                            value=team_name,
                            order=order_idx
                        )
                    else:
                        AnalyticsQueryCondition.objects.create(
                            group=group,
                            field='bets__event__name',
                            operator='contains',
                            value=team_name,
                            order=order_idx
                        )
                    order_idx += 1

                if bet_type_code:
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__bet_type__code',
                        operator='equals',
                        value=bet_type_code,
                        order=order_idx
                    )
                    order_idx += 1

                if filter_mode == 'won_coupons':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='status',
                        operator='equals',
                        value='won',
                        order=order_idx
                    )
                elif filter_mode == 'won_bets':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__result',
                        operator='equals',
                        value='win',
                        order=order_idx
                    )
                elif filter_mode == 'lost_bets':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__result',
                        operator='equals',
                        value='lost',
                        order=order_idx
                    )
                elif filter_mode == 'won_bets_lost_coupons':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__result',
                        operator='equals',
                        value='win',
                        order=order_idx
                    )
                    order_idx += 1
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='status',
                        operator='equals',
                        value='lost',
                        order=order_idx
                    )
                elif filter_mode == 'lost_bets_won_coupons':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__result',
                        operator='equals',
                        value='lost',
                        order=order_idx
                    )
                    order_idx += 1
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='status',
                        operator='equals',
                        value='won',
                        order=order_idx
                    )

            for idx, cond in enumerate(conditions):
                AnalyticsQueryCondition.objects.create(
                    group=group,
                    field=cond.get('field'),
                    operator=cond.get('operator', 'equals'),
                    value=cond.get('value'),
                    negate=cond.get('negate', False),
                    order=order_idx + idx
                )

        return query

    @swagger_auto_schema(
        operation_description="Zapisz nowy filtr na stałe.",
        request_body=SavedFilterInputSerializer,
        responses={201: AnalyticsQuerySerializer()}
    )
    def post(self, request):
        serializer = SavedFilterInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = self._create_query_from_params(request.user, serializer.validated_data)
        response_serializer = AnalyticsQuerySerializer(query)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class SavedFilterPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Preview filtra - tworzy tymczasowe query, wykonuje filtrowanie, zwraca wyniki i usuwa query.",
        request_body=SavedFilterInputSerializer,
        responses={200: 'Preview results with stats'}
    )
    def post(self, request):
        from coupons.services.coupon_filter_service import UniversalCouponFilterService
        from coupons.views.coupon_filter_view import CouponStatsMixin
        from coupons.serializers.coupon_filter_serializer import CouponFilterResponseSerializer

        serializer = SavedFilterInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        params = data.get('params') or {}

        try:
            query, coupons = UniversalCouponFilterService.apply_universal_filter(
                user=request.user,
                team_name=params.get('team_name'),
                position=params.get('position', 'any'),
                bet_type_code=params.get('bet_type_code'),
                filter_mode=params.get('filter_mode', 'all'),
                start_date=data.get('start_date'),
                end_date=data.get('end_date'),
            )

            stats = CouponStatsMixin.calculate_coupon_stats(coupons, use_decimal=True)
            coupons_serializer = CouponFilterResponseSerializer(coupons, many=True)

            response_data = {
                **stats,
                'coupons': coupons_serializer.data,
                'filters': params,
            }

            query.delete()

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SavedFilterDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Pobierz szczegóły zapisanego filtra.",
        responses={200: AnalyticsQuerySerializer()}
    )
    def get(self, request, pk: int):
        try:
            query = AnalyticsQuery.objects.get(id=pk, user=request.user)
        except AnalyticsQuery.DoesNotExist:
            return Response({"detail": "Filter not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AnalyticsQuerySerializer(query)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_description="Usuń zapisany filtr.",
        responses={204: 'Filter deleted'}
    )
    def delete(self, request, pk: int):
        try:
            query = AnalyticsQuery.objects.get(id=pk, user=request.user)
        except AnalyticsQuery.DoesNotExist:
            return Response({"detail": "Filter not found"}, status=status.HTTP_404_NOT_FOUND)

        query.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class CouponAnalyticsQuerySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Zwróć podsumowanie analityczne (ROI, yield, itp.) dla zapisanego AnalyticsQuery.",
        responses={200: 'Analytics summary for query'}
    )
    def get(self, request, pk: int):
        try:
            aq = AnalyticsQuery.objects.get(id=pk, user=request.user)
        except AnalyticsQuery.DoesNotExist:
            return Response({"detail": "AnalyticsQuery not found"}, status=status.HTTP_404_NOT_FOUND)

        builder = AnalyticsQueryBuilder(aq)
        qs = builder.apply()
        summary = get_coupon_analytics_summary_for_queryset(qs)
        return Response(summary, status=status.HTTP_200_OK)
