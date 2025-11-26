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
            'strategy': coupon.strategy.code if coupon.strategy else None,
            'coupon_type': coupon.coupon_type,
            'bet_stake': coupon.bet_stake,
            'bets': coupon.bets.all(),
        }

        serializer = CouponCopySerializer(copy_data, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
