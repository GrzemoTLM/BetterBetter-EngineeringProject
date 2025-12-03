from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Sum
from decimal import Decimal

from coupon_analytics.models import UserStrategy
from coupon_analytics.serializers.user_strategy_serializer import UserStrategySerializer
from coupons.models import Coupon


class UserStrategyListCreateView(generics.ListCreateAPIView):

    serializer_class = UserStrategySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserStrategy.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @swagger_auto_schema(
        operation_summary='List user strategies',
        operation_description='Get all betting strategies for authenticated user',
        responses={
            200: openapi.Response('List of strategies', UserStrategySerializer(many=True)),
            401: openapi.Response('Not authenticated'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create strategy',
        operation_description='Create a new betting strategy for authenticated user',
        request_body=UserStrategySerializer,
        responses={
            201: openapi.Response('Strategy created', UserStrategySerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Not authenticated'),
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class UserStrategyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific strategy
    """
    serializer_class = UserStrategySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        # Upewnij się że użytkownik może edytować tylko swoje strategie
        return UserStrategy.objects.filter(user=self.request.user)

    @swagger_auto_schema(
        operation_summary='Retrieve strategy',
        operation_description='Get details of a specific betting strategy',
        responses={
            200: openapi.Response('Strategy details', UserStrategySerializer),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update strategy (PUT)',
        operation_description='Full update of a betting strategy',
        request_body=UserStrategySerializer,
        responses={
            200: openapi.Response('Strategy updated', UserStrategySerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update strategy (PATCH)',
        operation_description='Partial update of a betting strategy',
        request_body=UserStrategySerializer,
        responses={
            200: openapi.Response('Strategy updated', UserStrategySerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete strategy',
        operation_description='Delete a betting strategy',
        responses={
            204: openapi.Response('Strategy deleted'),
            401: openapi.Response('Not authenticated'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class UserStrategySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get strategy coupon summary',
        operation_description='Get coupon profit statistics for a specific betting strategy. coupon_balance = suma profitów (wygrana - stawka dla wygranych, -stawka dla przegranych)',
        responses={
            200: openapi.Response('Strategy coupon summary'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Strategy not found'),
        }
    )
    def get(self, request, pk):
        try:
            strategy = UserStrategy.objects.get(id=pk, user=request.user)
        except UserStrategy.DoesNotExist:
            return Response({"error": "Strategy not found"}, status=status.HTTP_404_NOT_FOUND)

        # Balans kuponów = suma balance (profit po odjęciu stawek)
        won_agg = Coupon.objects.filter(
            user=request.user,
            strategy=strategy,
            status=Coupon.CouponStatus.WON
        ).aggregate(
            profit=Sum('balance'),
            count=Sum(1)
        )

        lost_agg = Coupon.objects.filter(
            user=request.user,
            strategy=strategy,
            status=Coupon.CouponStatus.LOST
        ).aggregate(
            profit=Sum('balance'),
            count=Sum(1)
        )

        won_profit = won_agg['profit'] or Decimal('0.00')
        won_count = won_agg['count'] or 0
        lost_profit = lost_agg['profit'] or Decimal('0.00')
        lost_count = lost_agg['count'] or 0
        total_profit = won_profit + lost_profit

        return Response({
            'strategy_id': strategy.id,
            'strategy_name': strategy.name,
            'description': strategy.description,
            'coupon_balance': float(total_profit),  # Suma profitów (po odjęciu stawek)
            'won_profit': float(won_profit),  # Suma profitów z wygranych
            'won_count': won_count,
            'lost_profit': float(lost_profit),  # Suma strat z przegranych
            'lost_count': lost_count,
        }, status=status.HTTP_200_OK)


class UserStrategiesSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get all strategies coupon summary',
        operation_description='Get coupon profit statistics for all betting strategies. coupon_balance = suma profitów (wygrana - stawka dla wygranych, -stawka dla przegranych)',
        responses={
            200: openapi.Response('Strategies coupon summary'),
            400: openapi.Response('Error calculating summary'),
        }
    )
    def get(self, request):
        try:
            strategies = UserStrategy.objects.filter(user=request.user).order_by('-created_at')
            results = []

            for strategy in strategies:
                # Balans kuponów = suma balance (profit po odjęciu stawek)
                won_agg = Coupon.objects.filter(
                    user=request.user,
                    strategy=strategy,
                    status=Coupon.CouponStatus.WON
                ).aggregate(
                    profit=Sum('balance'),
                    count=Sum(1)
                )

                lost_agg = Coupon.objects.filter(
                    user=request.user,
                    strategy=strategy,
                    status=Coupon.CouponStatus.LOST
                ).aggregate(
                    profit=Sum('balance'),
                    count=Sum(1)
                )

                won_profit = won_agg['profit'] or Decimal('0.00')
                won_count = won_agg['count'] or 0
                lost_profit = lost_agg['profit'] or Decimal('0.00')
                lost_count = lost_agg['count'] or 0
                total_profit = won_profit + lost_profit

                results.append({
                    'strategy_id': strategy.id,
                    'strategy_name': strategy.name,
                    'description': strategy.description,
                    'coupon_balance': float(total_profit),  # Suma profitów (po odjęciu stawek)
                    'won_profit': float(won_profit),  # Suma profitów z wygranych
                    'won_count': won_count,
                    'lost_profit': float(lost_profit),  # Suma strat z przegranych
                    'lost_count': lost_count,
                })

            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
