from decimal import Decimal
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from coupon_analytics.services.query_builder import AnalyticsQueryBuilder
from coupon_analytics.models.queries import AnalyticsQuery, AnalyticsQueryGroup, AnalyticsQueryCondition
from coupons.services.team_filter import TeamFilterService
from coupons.serializers.coupon_filter_serializer import (
    CouponFilterResponseSerializer,
    SimpleFilterRequestSerializer,
    QueryBuilderRequestSerializer,
)


class CouponFilterByTeamView(APIView):

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

        serializer_response = CouponFilterResponseSerializer(coupons, many=True)
        
        total_stake = sum(c.bet_stake for c in coupons)
        total_won = sum(c.balance for c in coupons)
        profit = total_won - total_stake
        win_count = coupons.filter(status='won').count()
        loss_count = coupons.filter(status='lost').count()

        return Response({
            'team_name': team_name,
            'position': position,
            'bet_type': bet_type,
            'only_won': only_won,
            'count': coupons.count(),
            'won_count': win_count,
            'lost_count': loss_count,
            'win_rate': (win_count / coupons.count() * 100) if coupons.count() > 0 else 0,
            'total_stake': total_stake,
            'total_won': total_won,
            'profit': profit,
            'roi': (profit / total_stake * 100) if total_stake > 0 else 0,
            'coupons': serializer_response.data
        })


class CouponFilterByQueryBuilderView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = QueryBuilderRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            query = AnalyticsQuery.objects.create(
                user=request.user,
                name=serializer.validated_data.get('name', 'API Query'),
                start_date=serializer.validated_data.get('start_date'),
                end_date=serializer.validated_data.get('end_date'),
            )

            group = AnalyticsQueryGroup.objects.create(
                analytics_query=query,
                operator='AND',
                parent=None,
                order=0
            )

            conditions = serializer.validated_data.get('conditions', [])
            for idx, cond in enumerate(conditions):
                AnalyticsQueryCondition.objects.create(
                    group=group,
                    field=cond.get('field'),
                    operator=cond.get('operator', 'equals'),
                    value=cond.get('value'),
                    negate=cond.get('negate', False),
                    order=idx
                )

            builder = AnalyticsQueryBuilder(query)
            coupons = builder.apply()

            serializer_response = CouponFilterResponseSerializer(coupons, many=True)
            
            total_stake = sum(c.bet_stake for c in coupons)
            total_won = sum(c.balance for c in coupons)
            profit = total_won - total_stake
            win_count = coupons.filter(status='won').count()
            loss_count = coupons.filter(status='lost').count()

            return Response({
                'query_id': query.id,
                'count': coupons.count(),
                'won_count': win_count,
                'lost_count': loss_count,
                'win_rate': (win_count / coupons.count() * 100) if coupons.count() > 0 else 0,
                'total_stake': total_stake,
                'total_won': total_won,
                'profit': profit,
                'roi': (profit / total_stake * 100) if total_stake > 0 else 0,
                'coupons': serializer_response.data
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



class CouponFilterUniversalView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        team_name = request.query_params.get('team_name')
        position = request.query_params.get('position', 'any')
        bet_type_code = request.query_params.get('bet_type_code')
        only_won_str = request.query_params.get('only_won', 'false').lower()
        only_won = only_won_str in ('true', '1', 'yes')

        if not team_name and not bet_type_code:
            return Response(
                {'error': 'Wymagany jest przynajmniej jeden z parametrów: team_name lub bet_type_code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            filter_name = []
            if team_name:
                filter_name.append(f'{team_name} ({position})')
            if bet_type_code:
                filter_name.append(bet_type_code)

            query = AnalyticsQuery.objects.create(
                user=request.user,
                name=f'Filter: {" + ".join(filter_name)}',
            )

            group = AnalyticsQueryGroup.objects.create(
                analytics_query=query,
                operator='AND',
                parent=None,
                order=0
            )

            order_idx = 0

            # Filtrowanie po drużynie (jeśli podana)
            if team_name:
                if position == 'home':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__event__home_team',
                        operator='contains',
                        value=team_name,
                        order=order_idx
                    )
                    order_idx += 1
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__line',
                        operator='equals',
                        value='1',
                        order=order_idx
                    )
                    order_idx += 1
                elif position == 'away':
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__event__away_team',
                        operator='contains',
                        value=team_name,
                        order=order_idx
                    )
                    order_idx += 1
                    AnalyticsQueryCondition.objects.create(
                        group=group,
                        field='bets__line',
                        operator='equals',
                        value='2',
                        order=order_idx
                    )
                    order_idx += 1
                else:
                    home_group = AnalyticsQueryGroup.objects.create(
                        analytics_query=query,
                        operator='OR',
                        parent=group,
                        order=0
                    )
                    AnalyticsQueryCondition.objects.create(
                        group=home_group,
                        field='bets__event__home_team',
                        operator='contains',
                        value=team_name,
                        order=0
                    )
                    AnalyticsQueryCondition.objects.create(
                        group=home_group,
                        field='bets__event__away_team',
                        operator='contains',
                        value=team_name,
                        order=1
                    )
                    order_idx = 1

            if bet_type_code:
                AnalyticsQueryCondition.objects.create(
                    group=group,
                    field='bets__bet_type__code',
                    operator='equals',
                    value=bet_type_code,
                    order=order_idx
                )
                order_idx += 1

            if only_won:
                AnalyticsQueryCondition.objects.create(
                    group=group,
                    field='bets__result',
                    operator='equals',
                    value='win',
                    order=order_idx
                )

            builder = AnalyticsQueryBuilder(query)
            coupons = builder.apply()

            serializer_response = CouponFilterResponseSerializer(coupons, many=True)

            total_stake = sum(Decimal(str(c.bet_stake)) for c in coupons) if coupons else Decimal('0.00')
            total_won = sum(Decimal(str(c.balance)) for c in coupons) if coupons else Decimal('0.00')
            profit = total_won - total_stake
            win_count = coupons.filter(status='won').count()
            loss_count = coupons.filter(status='lost').count()

            return Response({
                'query_id': query.id,
                'filters': {
                    'team_name': team_name,
                    'position': position if team_name else None,
                    'bet_type_code': bet_type_code,
                    'only_won': only_won,
                },
                'count': coupons.count(),
                'won_count': win_count,
                'lost_count': loss_count,
                'win_rate': (win_count / coupons.count() * 100) if coupons.count() > 0 else 0,
                'total_stake': str(total_stake),
                'total_won': str(total_won),
                'profit': str(profit),
                'roi': float((profit / total_stake * 100)) if total_stake > 0 else 0,
                'coupons': serializer_response.data
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
