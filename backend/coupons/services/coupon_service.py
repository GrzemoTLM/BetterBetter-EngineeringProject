from typing import List, Dict, Optional, Any
from django.db import transaction
from django.db.models import QuerySet
from ..models import Coupon, Bet
from decimal import Decimal, ROUND_HALF_UP


class CouponService:

    def bet_returned_odds(self, bet: Bet) -> Optional[Decimal]:
        if bet.result == Bet.BetResult.CANCELED:
            return Decimal('1.00')
        return Decimal(bet.odds)

    def quantize2_odds(self, odds: Decimal) -> Decimal:
        return odds.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def recalc_coupon_odds(self, coupon: Coupon) -> Coupon:
        bets = Bet.objects.filter(coupon=coupon).only('id', 'odds', 'result')
        total_odds = Decimal('1.00')
        for bet in bets:
            total_odds += self.bet_returned_odds(bet)
        coupon.multiplier = self.quantize2_odds(total_odds)
        coupon.save(update_fields=['multiplier'])
        return coupon

    @transaction.atomic
    def create_coupon(self, *, user, data: Dict[str, Any]) -> Coupon:
        bets_data: List[Dict[str, Any]] = data.pop('bets')

        if data.get('multiplier') is None:
            data['multiplier'] = Decimal('1.00')
            for b in bets_data:
                data['multiplier'] *= Decimal(b['odds'])
            data['multiplier'] = self.quantize2_odds(data['multiplier'])

        coupon = Coupon.objects.create(user=user, **data)
        Bet.objects.bulk_create([
            Bet(coupon=coupon, **bet_data) for bet_data in bets_data
        ])
        self.recalc_coupon_odds(coupon)
        return coupon

    @transaction.atomic
    def update_coupon(self, *, coupon: Coupon, data: Dict[str, Any]) -> Coupon:
        for field, value in data.items():
            setattr(coupon, field, value)
        coupon.save()
        self.recalc_coupon_odds(coupon)
        return coupon

    @transaction.atomic
    def delete_coupon(self, *, coupon: Coupon) -> None:
        Coupon.objects.select_for_update().get(id=coupon.id, user=coupon.user)
        coupon.delete()

    def get_coupon(self, coupon_id: int, user) -> Coupon:
        return Coupon.objects.get(id=coupon_id, user=user)

    def list_coupons(self, user) -> QuerySet[Coupon]:
        return Coupon.objects.filter(user=user).all()
_service = CouponService()

def recalc_coupon_odds(coupon: Coupon) -> Coupon:
    return _service.recalc_coupon_odds(coupon)


def create_coupon(user, data: Dict[str, Any]) -> Coupon:
    return _service.create_coupon(user=user, data=data)


def update_coupon(coupon: Coupon, data: Dict[str, Any]) -> Coupon:
    return _service.update_coupon(coupon=coupon, data=data)


def delete_coupon(coupon: Coupon) -> None:
    return _service.delete_coupon(coupon=coupon)


def get_coupon(coupon_id: int, user) -> Coupon:
    return _service.get_coupon(coupon_id=coupon_id, user=user)


def list_coupons(user) -> QuerySet[Coupon]:
    return _service.list_coupons(user=user)
