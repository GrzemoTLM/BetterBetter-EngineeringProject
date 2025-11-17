from decimal import Decimal
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from coupons.services.team_filter import TeamFilterService
from coupons.services.coupon_filter_service import UniversalCouponFilterService
from coupons.serializers.coupon_filter_serializer import (
    CouponFilterResponseSerializer,
    SimpleFilterRequestSerializer,
    QueryBuilderRequestSerializer,
)


class CouponStatsMixin:

    @staticmethod
    def calculate_coupon_stats(coupons, use_decimal=False):
        if use_decimal:
            total_stake = sum(Decimal(str(c.bet_stake)) for c in coupons) if coupons else Decimal('0.00')
            total_won = sum(Decimal(str(c.balance)) for c in coupons) if coupons else Decimal('0.00')
            profit = total_won - total_stake
        else:
            total_stake = sum(c.bet_stake for c in coupons) if coupons else 0
            total_won = sum(c.balance for c in coupons) if coupons else 0
            profit = total_won - total_stake

        win_count = coupons.filter(status='won').count()
        loss_count = coupons.filter(status='lost').count()
        total_count = coupons.count()

        win_rate = (win_count / total_count * 100) if total_count > 0 else 0
        roi = (profit / total_stake * 100) if total_stake > 0 else 0

        if use_decimal:
            return {
                'count': total_count,
                'won_count': win_count,
                'lost_count': loss_count,
                'win_rate': win_rate,
                'total_stake': str(total_stake),
                'total_won': str(total_won),
                'profit': str(profit),
                'roi': float(roi),
            }
        else:
            return {
                'count': total_count,
                'won_count': win_count,
                'lost_count': loss_count,
                'win_rate': win_rate,
                'total_stake': total_stake,
                'total_won': total_won,
                'profit': profit,
                'roi': roi,
            }

    @staticmethod
    def build_response_with_stats(coupons, extra_data=None, use_decimal=False):
        serializer_response = CouponFilterResponseSerializer(coupons, many=True)
        stats = CouponStatsMixin.calculate_coupon_stats(coupons, use_decimal=use_decimal)

        response_data = {
            **stats,
            'coupons': serializer_response.data
        }

        if extra_data:
            response_data.update(extra_data)

        return response_data


class CouponFilterByTeamView(APIView, CouponStatsMixin):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = SimpleFilterRequestSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        team_name = serializer.validated_data.get('team_name')
        position = serializer.validated_data.get('position', 'any')
        bet_type = serializer.validated_data.get('bet_type')
        only_won = serializer.validated_data.get('only_won', True)
        status_filter = serializer.validated_data.get('status', 'any')

        if not team_name:
            return Response(
                {'error': 'team_name jest wymagany'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if position == 'home':
            if bet_type:
                coupons = TeamFilterService.get_coupons_by_team_and_bet_type(
                    user=request.user,
                    team_name=team_name,
                    bet_type_code=bet_type,
                    as_home=True,
                    won=only_won
                )
            else:
                coupons = TeamFilterService.get_coupons_by_home_team(
                    user=request.user,
                    team_name=team_name,
                    only_won=only_won
                )

        elif position == 'away':
            if bet_type:
                coupons = TeamFilterService.get_coupons_by_team_and_bet_type(
                    user=request.user,
                    team_name=team_name,
                    bet_type_code=bet_type,
                    as_home=False,
                    won=only_won
                )
            else:
                coupons = TeamFilterService.get_coupons_by_away_team(
                    user=request.user,
                    team_name=team_name,
                    only_won=only_won
                )

        else:
            home_coupons = TeamFilterService.get_coupons_by_home_team(
                user=request.user,
                team_name=team_name,
                only_won=only_won
            )
            away_coupons = TeamFilterService.get_coupons_by_away_team(
                user=request.user,
                team_name=team_name,
                only_won=only_won
            )
            coupons = (home_coupons | away_coupons).distinct()

        extra_data = {
            'team_name': team_name,
            'position': position,
            'bet_type': bet_type,
            'only_won': only_won,
        }

        response_data = self.build_response_with_stats(coupons, extra_data=extra_data)
        return Response(response_data)


class CouponFilterByQueryBuilderView(APIView, CouponStatsMixin):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = QueryBuilderRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            query, coupons = UniversalCouponFilterService.build_custom_query(
                user=request.user,
                name=serializer.validated_data.get('name', 'API Query'),
                conditions=serializer.validated_data.get('conditions', []),
                start_date=serializer.validated_data.get('start_date'),
                end_date=serializer.validated_data.get('end_date'),
            )


            extra_data = {'query_id': query.id}
            response_data = self.build_response_with_stats(coupons, extra_data=extra_data)
            return Response(response_data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



class CouponFilterUniversalView(APIView, CouponStatsMixin):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        team_name = request.query_params.get('team_name')
        position = request.query_params.get('position', 'any')
        bet_type_code = request.query_params.get('bet_type_code')
        only_won_str = request.query_params.get('only_won', 'false').lower()
        only_won = only_won_str in ('true', '1', 'yes')

        filter_mode = request.query_params.get('filter_mode', 'all')

        if not team_name and not bet_type_code:
            return Response(
                {'error': 'Wymagany jest przynajmniej jeden z parametrów: team_name lub bet_type_code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if only_won:
                filter_mode = 'won_bets'

            query, coupons = UniversalCouponFilterService.apply_universal_filter(
                user=request.user,
                team_name=team_name,
                position=position,
                bet_type_code=bet_type_code,
                filter_mode=filter_mode,
            )

            extra_data = {
                'query_id': query.id,
                'filters': {
                    'team_name': team_name,
                    'position': position if team_name else None,
                    'bet_type_code': bet_type_code,
                    'filter_mode': filter_mode,
                    'only_won': only_won,
                },
            }

            response_data = self.build_response_with_stats(coupons, extra_data=extra_data, use_decimal=True)
            return Response(response_data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
