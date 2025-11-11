
from coupons.models import Coupon, Event
from django.db.models import Q, F


class TeamFilterService:

    
    @staticmethod
    def get_coupons_by_home_team(user, team_name: str, only_won=False):
        queryset = Coupon.objects.filter(
            user=user,
            bets__event__home_team=team_name
        ).select_related('bookmaker_account', 'user').prefetch_related('bets__event', 'bets__bet_type').distinct()
        
        if only_won:
            queryset = queryset.filter(status='won')

        return queryset

    @staticmethod
    def get_coupons_by_away_team(user, team_name: str, only_won=False):
        queryset = Coupon.objects.filter(
            user=user,
            bets__event__away_team=team_name
        ).select_related('bookmaker_account', 'user').prefetch_related('bets__event', 'bets__bet_type').distinct()
        
        if only_won:
            queryset = queryset.filter(status='won')

        return queryset

    @staticmethod
    def get_coupons_by_team_and_result(user, team_name: str, as_home=True, won=True):
        if as_home:
            queryset = Coupon.objects.filter(
                user=user,
                bets__event__home_team=team_name,
                status='won' if won else 'lost'
            )
        else:
            queryset = Coupon.objects.filter(
                user=user,
                bets__event__away_team=team_name,
                status='won' if won else 'lost'
            )
        
        return queryset.select_related('bookmaker_account', 'user').prefetch_related('bets__event', 'bets__bet_type').distinct()

    @staticmethod
    def get_coupons_by_team_and_bet_type(user, team_name: str, bet_type_code: str, as_home=True, won=True):
        if as_home:
            queryset = Coupon.objects.filter(
                user=user,
                bets__event__home_team=team_name,
                bets__bet_type__code=bet_type_code,
                status='won' if won else 'lost'
            )
        else:
            queryset = Coupon.objects.filter(
                user=user,
                bets__event__away_team=team_name,
                bets__bet_type__code=bet_type_code,
                status='won' if won else 'lost'
            )
        
        return queryset.select_related('bookmaker_account', 'user').prefetch_related('bets__event', 'bets__bet_type').distinct()

    @staticmethod
    def get_coupons_home_team_won(user, team_name: str):
        queryset = Coupon.objects.filter(
            user=user,
            bets__event__home_team=team_name,
            bets__bet_type__code='1',
            status='won'
        ).select_related('bookmaker_account', 'user').prefetch_related('bets__event', 'bets__bet_type').distinct()
        
        return queryset

    @staticmethod
    def get_coupons_away_team_won(user, team_name: str):
        queryset = Coupon.objects.filter(
            user=user,
            bets__event__away_team=team_name,
            bets__bet_type__code='2',
            status='won'
        ).select_related('bookmaker_account', 'user').prefetch_related('bets__event', 'bets__bet_type').distinct()
        
        return queryset

    @staticmethod
    def get_team_statistics(user, team_name: str, as_home=True):
        if as_home:
            coupons_queryset = Coupon.objects.filter(
                user=user,
                bets__event__home_team=team_name
            ).distinct()
        else:
            coupons_queryset = Coupon.objects.filter(
                user=user,
                bets__event__away_team=team_name
            ).distinct()
        
        won_coupons_queryset = coupons_queryset.filter(status='won')
        lost_coupons_queryset = coupons_queryset.filter(status='lost')

        total_payout = sum(c.balance for c in won_coupons_queryset)
        total_stake = sum(c.bet_stake for c in coupons_queryset)

        profit = total_payout - total_stake
        win_rate = (won_coupons_queryset.count() / coupons_queryset.count() * 100) if coupons_queryset.count() > 0 else 0

        yield_percentage = 0
        if total_payout > 0:
            yield_percentage = (profit / total_payout * 100)

        return {
            'team_name': team_name,
            'position': 'Home' if as_home else 'Away',
            'total_coupons': coupons_queryset.count(),
            'won': won_coupons_queryset.count(),
            'lost': lost_coupons_queryset.count(),
            'win_rate': win_rate,
            'total_stake': total_stake,
            'total_payout': total_payout,
            'profit': profit,
            'yield_percentage': yield_percentage,
        }

