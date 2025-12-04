from django.db.models import QuerySet, Prefetch
from typing import Optional, List, Dict, Any
from ..models import Coupon, Bet, BetTypeDict
from coupon_analytics.models.queries import AnalyticsQuery, AnalyticsQueryGroup, AnalyticsQueryCondition
from coupon_analytics.services.query_builder import AnalyticsQueryBuilder


class CouponFilterService:
    @staticmethod
    def get_coupons_with_bet_type(
        user,
        bet_type_code: str,
        status: Optional[str] = None,
        only_won_bets: bool = False
    ) -> QuerySet:

        try:
            bet_type = BetTypeDict.objects.get(code=bet_type_code)
        except BetTypeDict.DoesNotExist:
            return Coupon.objects.none()

        coupons = Coupon.objects.filter(user=user)

        if status:
            coupons = coupons.filter(status=status)

        coupons = coupons.filter(bets__bet_type=bet_type).distinct()

        bets_prefetch = Prefetch(
            'bets',
            queryset=Bet.objects.filter(bet_type=bet_type)
        )
        coupons = coupons.prefetch_related(bets_prefetch)

        if only_won_bets:
            coupons_with_won_bets = []
            for coupon in coupons:
                won_bets = [b for b in coupon.bets.all() if b.result == Bet.BetResult.WIN]
                if won_bets:
                    coupons_with_won_bets.append(coupon)

            if coupons_with_won_bets:
                coupon_ids = [c.id for c in coupons_with_won_bets]
                coupons = Coupon.objects.filter(id__in=coupon_ids).prefetch_related(bets_prefetch)
            else:
                coupons = Coupon.objects.none()

        return coupons.select_related('user', 'bookmaker_account', 'strategy')

    @staticmethod
    def get_coupon_stats_for_bet_type(
        user,
        bet_type_code: str,
        status: Optional[str] = None,
        only_won_bets: bool = False
    ) -> dict:

        coupons = CouponFilterService.get_coupons_with_bet_type(
            user=user,
            bet_type_code=bet_type_code,
            status=status,
            only_won_bets=only_won_bets
        )

        total_coupons = coupons.count()
        if total_coupons == 0:
            return {
                'bet_type_code': bet_type_code,
                'total_coupons': 0,
                'won_coupons': 0,
                'lost_coupons': 0,
                'in_progress_coupons': 0,
                'total_stake': 0,
                'total_payout': 0,
                'yield_percentage': 0,
                'win_rate': 0,
            }

        won_count = coupons.filter(status=Coupon.CouponStatus.WON).count()
        lost_count = coupons.filter(status=Coupon.CouponStatus.LOST).count()
        in_progress_count = coupons.filter(status=Coupon.CouponStatus.IN_PROGRESS).count()

        total_stake = sum(float(c.bet_stake) for c in coupons)
        total_payout = sum(c.potential_payout for c in coupons)

        yield_percentage = 0
        if total_payout > 0:
            yield_percentage = ((total_payout - total_stake) / total_payout) * 100

        win_rate = 0
        if total_coupons > 0:
            win_rate = (won_count / total_coupons) * 100

        return {
            'bet_type_code': bet_type_code,
            'total_coupons': total_coupons,
            'won_coupons': won_count,
            'lost_coupons': lost_count,
            'in_progress_coupons': in_progress_count,
            'total_stake': round(total_stake, 2),
            'total_payout': round(total_payout, 2),
            'yield_percentage': round(yield_percentage, 2),
            'win_rate': round(win_rate, 2),
        }

    @staticmethod
    def get_available_bet_types(user) -> List[str]:

        bet_types = BetTypeDict.objects.filter(
            bets__coupon__user=user
        ).values_list('code', flat=True).distinct()

        return list(bet_types)


class UniversalCouponFilterService:

    @staticmethod
    def build_team_position_query(
        user,
        query: AnalyticsQuery,
        parent_group: AnalyticsQueryGroup,
        team_name: str,
        position: str,
        order_idx: int
    ) -> int:
        if position == 'home':
            AnalyticsQueryCondition.objects.create(
                group=parent_group,
                field='bets__event__home_team',
                operator='contains',
                value=team_name,
                order=order_idx
            )
            order_idx += 1
            AnalyticsQueryCondition.objects.create(
                group=parent_group,
                field='bets__line',
                operator='equals',
                value='1',
                order=order_idx
            )
            order_idx += 1
        elif position == 'away':
            AnalyticsQueryCondition.objects.create(
                group=parent_group,
                field='bets__event__away_team',
                operator='contains',
                value=team_name,
                order=order_idx
            )
            order_idx += 1
            AnalyticsQueryCondition.objects.create(
                group=parent_group,
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
                parent=parent_group,
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

        return order_idx

    @staticmethod
    def build_universal_filter_query(
        user,
        team_name: Optional[str] = None,
        position: str = 'any',
        bet_type_code: Optional[str] = None,
        filter_mode: str = 'all',
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> AnalyticsQuery:
        filter_name = []
        if team_name:
            filter_name.append(f'{team_name} ({position})')
        if bet_type_code:
            filter_name.append(bet_type_code)

        query = AnalyticsQuery.objects.create(
            user=user,
            name=f'Filter: {" + ".join(filter_name)}' if filter_name else 'Universal Filter',
            start_date=start_date,
            end_date=end_date,
        )

        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator='AND',
            parent=None,
            order=0
        )

        order_idx = 0

        if team_name:
            order_idx = UniversalCouponFilterService.build_team_position_query(
                user=user,
                query=query,
                parent_group=group,
                team_name=team_name,
                position=position,
                order_idx=order_idx
            )

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
            order_idx += 1
        elif filter_mode == 'won_bets':
            AnalyticsQueryCondition.objects.create(
                group=group,
                field='bets__result',
                operator='equals',
                value='win',
                order=order_idx
            )
            order_idx += 1
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
            order_idx += 1
        elif filter_mode == 'lost_bets':
            AnalyticsQueryCondition.objects.create(
                group=group,
                field='bets__result',
                operator='equals',
                value='lost',
                order=order_idx
            )
            order_idx += 1
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
            order_idx += 1

        return query

    @staticmethod
    def apply_universal_filter(
        user,
        team_name: Optional[str] = None,
        position: str = 'any',
        bet_type_code: Optional[str] = None,
        filter_mode: str = 'all',
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> tuple[AnalyticsQuery, QuerySet]:
        from django.db.models import Exists, OuterRef, Q

        query = UniversalCouponFilterService.build_universal_filter_query(
            user=user,
            team_name=team_name,
            position=position,
            bet_type_code=bet_type_code,
            filter_mode=filter_mode,
            start_date=start_date,
            end_date=end_date,
        )

        coupons = Coupon.objects.filter(user=user)

        if start_date:
            coupons = coupons.filter(created_at__date__gte=start_date)
        if end_date:
            coupons = coupons.filter(created_at__date__lte=end_date)

        bet_filter = Q()

        if team_name:
            if position == 'home':
                bet_filter &= Q(event__home_team__icontains=team_name)
            elif position == 'away':
                bet_filter &= Q(event__away_team__icontains=team_name)
            else:
                bet_filter &= (Q(event__home_team__icontains=team_name) | Q(event__away_team__icontains=team_name))

        if bet_type_code:
            bet_filter &= Q(bet_type__code=bet_type_code)

        if filter_mode == 'won_bets':
            bet_filter &= Q(result='win')
        elif filter_mode == 'won_bets_lost_coupons':
            bet_filter &= Q(result='win')
            coupons = coupons.filter(status='lost')
        elif filter_mode == 'lost_bets':
            bet_filter &= Q(result='lost')
        elif filter_mode == 'lost_bets_won_coupons':
            bet_filter &= Q(result='lost')
            coupons = coupons.filter(status='won')
        elif filter_mode == 'won_coupons':
            coupons = coupons.filter(status='won')

        if bet_filter:
            bet_subquery = Bet.objects.filter(
                coupon=OuterRef('pk')
            ).filter(bet_filter)
            coupons = coupons.filter(Exists(bet_subquery))

        coupons = coupons.distinct()

        return query, coupons

    @staticmethod
    def build_custom_query(
        user,
        name: str,
        conditions: List[Dict[str, Any]],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> tuple[AnalyticsQuery, QuerySet]:
        query = AnalyticsQuery.objects.create(
            user=user,
            name=name,
            start_date=start_date,
            end_date=end_date,
        )

        group = AnalyticsQueryGroup.objects.create(
            analytics_query=query,
            operator='AND',
            parent=None,
            order=0
        )

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

        return query, coupons


