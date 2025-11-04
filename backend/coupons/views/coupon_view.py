from rest_framework import generics, permissions, status
from rest_framework.response import Response

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
    recalc_coupon_odds,
    settle_coupon,
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


class CouponRecalcView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CouponSerializer

    def post(self, request, pk, *args, **kwargs):
        try:
            coupon = Coupon.objects.get(id=pk, user=request.user)
        except Coupon.DoesNotExist:
            return Response({"detail": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)
        updated = recalc_coupon_odds(coupon)
        out_serializer = self.get_serializer(updated, context={'request': request})
        return Response(out_serializer.data)


class CouponSettleView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CouponSerializer

    def post(self, request, pk, *args, **kwargs):
        """
        Settle a coupon by setting the status and calculating final balance.

        Request body should contain bet results:
        {
            "bets": [
                {"bet_id": 1, "result": "win"},
                {"bet_id": 2, "result": "lost"},
                ...
            ]
        }
        """
        try:
            coupon = Coupon.objects.get(id=pk, user=request.user)
        except Coupon.DoesNotExist:
            return Response({"detail": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)

        updated = settle_coupon(coupon=coupon, data=request.data)
        out_serializer = self.get_serializer(updated, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_200_OK)
