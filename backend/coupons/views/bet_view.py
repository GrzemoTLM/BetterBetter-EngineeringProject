from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
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

    @swagger_auto_schema(
        operation_summary='List bets',
        operation_description='Get all bets for a specific coupon',
        responses={
            200: openapi.Response('List of bets', BetSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Coupon not found'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create bet',
        operation_description='Create one or multiple bets for a coupon',
        request_body=BetCreateSerializer,
        responses={
            201: openapi.Response('Bet(s) created', BetSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Coupon not found'),
        }
    )
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

    @swagger_auto_schema(
        operation_summary='Retrieve bet',
        operation_description='Get a specific bet details',
        responses={
            200: openapi.Response('Bet details', BetSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet not found'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update bet',
        operation_description='Update a bet (PUT)',
        request_body=BetUpdateSerializer,
        responses={
            200: openapi.Response('Bet updated', BetSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet not found'),
        }
    )
    def put(self, request, *args, **kwargs):
        in_serializer = BetUpdateSerializer(data=request.data, context={'request': request})
        in_serializer.is_valid(raise_exception=True)

        updated = update_bet(
            user=request.user,
            bet_id=self.kwargs.get('pk'),
            data=in_serializer.validated_data
        )
        out_serializer = BetSerializer(instance=updated, context={'request': request})
        return Response(out_serializer.data)

    @swagger_auto_schema(
        operation_summary='Partial update bet',
        operation_description='Update a bet (PATCH)',
        request_body=BetUpdateSerializer,
        responses={
            200: openapi.Response('Bet updated', BetSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet not found'),
        }
    )
    def patch(self, request, *args, **kwargs):
        in_serializer = BetUpdateSerializer(data=request.data, partial=True, context={'request': request})
        in_serializer.is_valid(raise_exception=True)

        updated = update_bet(
            user=request.user,
            bet_id=self.kwargs.get('pk'),
            data=in_serializer.validated_data
        )
        out_serializer = BetSerializer(instance=updated, context={'request': request})
        return Response(out_serializer.data)

    @swagger_auto_schema(
        operation_summary='Delete bet',
        operation_description='Delete a bet',
        responses={
            204: openapi.Response('Bet deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Bet not found'),
        }
    )
    def delete(self, request, *args, **kwargs):
        delete_bet(user=request.user, bet_id=self.kwargs.get('pk'))
        return Response(status=status.HTTP_204_NO_CONTENT)

