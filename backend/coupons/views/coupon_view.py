from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

logger = logging.getLogger(__name__)

from ..models import Coupon
from ..serializers.coupon_serializer import (
    CouponSerializer,
    CouponCreateSerializer,
    CouponUpdateSerializer,
)
from ..services.coupon_service import (
    list_coupons,
    create_coupon,
    update_coupon,
    delete_coupon,
    settle_coupon,
    recalc_and_evaluate_coupon,
    force_settle_coupon_won,
)
from .coupon_filter_view import CouponStatsMixin
from rest_framework.views import APIView
from datetime import datetime, timedelta
from django.db.models import Avg
from finances.models import BookmakerAccountModel
from common.choices import CouponType


class CouponListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Coupon.objects.none()
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return Coupon.objects.none()
        return list_coupons(user=self.request.user)

    def get_serializer_class(self):
        return CouponCreateSerializer if self.request.method == 'POST' \
            else CouponSerializer

    def create(self, request, *args, **kwargs):
        in_serializer = self.get_serializer(data=request.data)
        if not in_serializer.is_valid():
            logger.error(f"Coupon creation validation error: {in_serializer.errors}")
            logger.error(f"Request data: {request.data}")
        in_serializer.is_valid(raise_exception=True)
        coupon = create_coupon(
            user=request.user,
            data=in_serializer.validated_data
        )
        out_serializer = CouponSerializer(
            coupon,
            context={'request': request}
        )
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class CouponDetailsView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Coupon.objects.none()
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return Coupon.objects.none()
        return Coupon.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CouponUpdateSerializer
        return CouponSerializer

    def update(self, request, *args, **kwargs):
        coupon = self.get_object()
        in_serializer = self.get_serializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        updated = update_coupon(
            coupon=coupon,
            data=in_serializer.validated_data
        )
        out_serializer = CouponSerializer(
            updated,
            context={'request': request}
        )
        return Response(out_serializer.data)

    def destroy(self, request, *args, **kwargs):
        coupon = self.get_object()
        coupon_id = coupon.id
        delete_coupon(coupon=coupon)
        return Response(
            {"detail": f"Coupon {coupon_id} was successfully deleted."},
            status=status.HTTP_200_OK
        )


class _CouponRetrieveMixin:
    def _get_coupon(self, pk, request):
        base_qs = Coupon.objects.filter(id=pk)
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        if not (user.is_staff or user.is_superuser):
            base_qs = base_qs.filter(user=user)
        return base_qs.first()

    def _fetch_or_404(self, pk, request):
        coupon = self._get_coupon(pk, request)
        if coupon is None:
            return None, Response({"detail": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)
        return coupon, None


class CouponRecalcView(_CouponRetrieveMixin, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CouponSerializer

    @swagger_auto_schema(
        operation_summary='Recalculate coupon',
        operation_description='Recalculate coupon status and evaluate results',
        responses={
            200: openapi.Response('Updated coupon', CouponSerializer),
            404: openapi.Response('Coupon not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, pk, *args, **kwargs):
        coupon, error = self._fetch_or_404(pk, request)
        if error:
            return error
        updated = recalc_and_evaluate_coupon(coupon)
        out_serializer = self.get_serializer(updated, context={'request': request})
        return Response(out_serializer.data)


class CouponSettleView(_CouponRetrieveMixin, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CouponSerializer

    @swagger_auto_schema(
        operation_summary='Settle coupon',
        operation_description='Manually settle coupon with provided data',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            description='Settlement data'
        ),
        responses={
            200: openapi.Response('Updated coupon', CouponSerializer),
            404: openapi.Response('Coupon not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, pk, *args, **kwargs):
        coupon, error = self._fetch_or_404(pk, request)
        if error:
            return error
        updated = settle_coupon(coupon=coupon, data=request.data)
        out_serializer = self.get_serializer(updated, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_200_OK)


class CouponForceWinView(_CouponRetrieveMixin, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CouponSerializer

    @swagger_auto_schema(
        operation_summary='Force coupon as won',
        operation_description='Manually mark coupon as won',
        responses={
            200: openapi.Response('Updated coupon', CouponSerializer),
            404: openapi.Response('Coupon not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def post(self, request, pk, *args, **kwargs):
        coupon, error = self._fetch_or_404(pk, request)
        if error:
            return error
        updated = force_settle_coupon_won(coupon)
        out_serializer = self.get_serializer(updated, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_200_OK)


class CouponCopyView(_CouponRetrieveMixin, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Copy coupon',
        operation_description='Get coupon data for copying',
        responses={
            200: openapi.Response('Coupon data ready for copy'),
            404: openapi.Response('Coupon not found'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request, pk, *args, **kwargs):
        coupon, error = self._fetch_or_404(pk, request)
        if error:
            return error

        from ..serializers.coupon_serializer import CouponCopySerializer

        copy_data = {
            'bookmaker_account': coupon.bookmaker_account_id,
            'strategy': coupon.strategy.name if coupon.strategy else None,
            'coupon_type': coupon.coupon_type,
            'bet_stake': coupon.bet_stake,
            'bets': coupon.bets.all(),
        }

        serializer = CouponCopySerializer(copy_data, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CouponSummaryView(APIView, CouponStatsMixin):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Coupon summary',
        operation_description='Zwraca podsumowanie kuponów użytkownika (count, won, lost, in_progress, canceled, win_rate, total_stake, total_won, profit, roi, avg_coupon_odds) z opcjonalnym filtrem po dacie (date_from, date_to w formacie YYYY-MM-DD). Jeśli nie podasz dat – liczy całość.',
        manual_parameters=[
            openapi.Parameter('date_from', openapi.IN_QUERY, description='Data od (YYYY-MM-DD)', type=openapi.TYPE_STRING),
            openapi.Parameter('date_to', openapi.IN_QUERY, description='Data do (YYYY-MM-DD)', type=openapi.TYPE_STRING),
            openapi.Parameter('bookmaker_account_id', openapi.IN_QUERY, description='Opcjonalne ID konta bukmachera użytkownika', type=openapi.TYPE_INTEGER),
            openapi.Parameter('bookmaker_account', openapi.IN_QUERY, description='Alias dla bookmaker_account_id wspierany dla kompatybilności wstecznej', type=openapi.TYPE_INTEGER),
            openapi.Parameter('coupon_type', openapi.IN_QUERY, description='Opcjonalny typ kuponu (SOLO, AKO, SYSTEM)', type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response('Coupon summary'),
            400: openapi.Response('Błąd zapytania'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def get(self, request):
        qp = request.query_params
        date_from_raw = qp.get('date_from')
        date_to_raw = qp.get('date_to')
        bookmaker_account_raw = qp.get('bookmaker_account_id') or qp.get('bookmaker_account')
        coupon_type_raw = qp.get('coupon_type')
        date_from = None
        date_to = None
        bookmaker_account_id = None
        coupon_type = None
        if date_from_raw:
            try:
                date_from = datetime.strptime(date_from_raw, '%Y-%m-%d')
            except ValueError:
                return Response({'error': 'Invalid date_from format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        if date_to_raw:
            try:
                date_to = datetime.strptime(date_to_raw, '%Y-%m-%d') + timedelta(hours=23, minutes=59, seconds=59)
            except ValueError:
                return Response({'error': 'Invalid date_to format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        if date_from and date_to and date_from > date_to:
            return Response({'error': 'date_from cannot be later than date_to.'}, status=status.HTTP_400_BAD_REQUEST)

        if bookmaker_account_raw:
            try:
                bookmaker_account_id = int(bookmaker_account_raw)
            except (TypeError, ValueError):
                return Response({'error': 'bookmaker_account_id must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)
            if bookmaker_account_id <= 0:
                return Response({'error': 'bookmaker_account_id must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)
            account_exists = BookmakerAccountModel.objects.filter(id=bookmaker_account_id, user=request.user).exists()
            if not account_exists:
                return Response({'error': 'Bookmaker account not found for this user.'}, status=status.HTTP_404_NOT_FOUND)

        if coupon_type_raw:
            normalized_coupon_type = coupon_type_raw.strip().upper()
            if normalized_coupon_type not in CouponType.values:
                return Response({'error': 'coupon_type must be one of: %s.' % ', '.join(CouponType.values)}, status=status.HTTP_400_BAD_REQUEST)
            coupon_type = normalized_coupon_type

        coupons_qs = Coupon.objects.filter(user=request.user)
        if date_from:
            coupons_qs = coupons_qs.filter(created_at__gte=date_from)
        if date_to:
            coupons_qs = coupons_qs.filter(created_at__lte=date_to)
        if bookmaker_account_id:
            coupons_qs = coupons_qs.filter(bookmaker_account_id=bookmaker_account_id)
        if coupon_type:
            coupons_qs = coupons_qs.filter(coupon_type=coupon_type)

        # Statystyki podstawowe
        total_count = coupons_qs.count()
        won_count = coupons_qs.filter(status=Coupon.CouponStatus.WON).count()
        lost_count = coupons_qs.filter(status=Coupon.CouponStatus.LOST).count()
        in_progress_count = coupons_qs.filter(status=Coupon.CouponStatus.IN_PROGRESS).count()
        canceled_count = coupons_qs.filter(status=Coupon.CouponStatus.CANCELED).count()

        from decimal import Decimal
        total_stake = sum((c.bet_stake for c in coupons_qs)) if total_count else Decimal('0.00')
        total_won_amount = sum((c.balance for c in coupons_qs)) if total_count else Decimal('0.00')
        profit = total_won_amount - total_stake
        win_rate = round((won_count / total_count * 100), 2) if total_count > 0 else 0.0
        roi = round((profit / total_stake * 100), 2) if total_stake > 0 else 0.0

        # Średni kurs kuponu (średnia z multiplier)
        avg_mult = coupons_qs.aggregate(avg=Avg('multiplier')).get('avg')
        if avg_mult is None:
            avg_coupon_odds = 0.0
        else:
            try:
                avg_coupon_odds = float(Decimal(str(avg_mult)).quantize(Decimal('0.01')))
            except Exception:
                avg_coupon_odds = float(avg_mult)

        return Response({
            'date_from': date_from_raw,
            'date_to': date_to_raw,
            'bookmaker_account_id': bookmaker_account_id,
            'coupon_type': coupon_type,
            'count': total_count,
            'won_count': won_count,
            'lost_count': lost_count,
            'in_progress_count': in_progress_count,
            'canceled_count': canceled_count,
            'win_rate': win_rate,
            'total_stake': str(total_stake),
            'total_won': str(total_won_amount),
            'profit': str(profit),
            'roi': roi,
            'avg_coupon_odds': avg_coupon_odds,
        }, status=status.HTTP_200_OK)
