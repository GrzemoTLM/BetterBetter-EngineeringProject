from django.db.models import QuerySet, Q, Prefetch
from typing import Optional, List
from ..models import Coupon, Bet, BetTypeDict


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

