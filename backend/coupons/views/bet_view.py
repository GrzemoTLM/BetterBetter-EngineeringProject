from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from ..models import Bet, Coupon
from ..serializers.bet_serializer import BetSerializer, BetCreateSerializer, BetUpdateSerializer
from ..services.bet_service import create_bet, update_bet, delete_bet, list_bets

class BetListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Bet.objects.none()
        user = getattr(self.request, 'user', None)

        if not user or not user.is_authenticated:
            return Bet.objects.none()
        coupon_id = self.kwargs.get('coupon_id')

        try:
            coupon = Coupon.objects.get(id=coupon_id, user=self.request.user)
        except Coupon.DoesNotExist:
            raise NotFound("Coupon not found.")

        return list_bets(user=self.request.user, coupon_id=coupon_id)

    def get_serializer_class(self):
        return BetCreateSerializer if self.request.method == 'POST' else BetSerializer

    def create(self, request, *args, **kwargs):
        coupon_id = self.kwargs.get('coupon_id')
        payload = request.data

        if isinstance(payload, dict) and 'bets' in payload:
            items = payload['bets']

        elif isinstance(payload, list):
            items = payload

        else:
            items = [payload]

        created = []
        for item in items:
            in_serializer = BetCreateSerializer(data=item, context={'request': request})
            in_serializer.is_valid(raise_exception=True)

            try:
                bet = create_bet(
                    user=request.user,
                    coupon_id=coupon_id,
                    data=in_serializer.validated_data
                )
            except Coupon.DoesNotExist:
                raise NotFound("Coupon not found.")
            created.append(bet)

        if len(created) == 1:
            out_serializer = BetSerializer(created[0], context={'request': request})
            return Response(out_serializer.data, status=status.HTTP_201_CREATED)
        out_serializer = BetSerializer(created, many=True, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class BetDetailsView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Bet.objects.none()
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return Bet.objects.none()
        return Bet.objects.filter(coupon__user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BetUpdateSerializer
        return BetSerializer

    def update(self, request, *args, **kwargs):
        updated = update_bet(
            user=request.user,
            bet_id=self.kwargs.get('pk'),
            data=request.data
        )
        serializer = self.get_serializer(instance=updated)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        delete_bet(user=self.request.user, bet_id=instance.id)

