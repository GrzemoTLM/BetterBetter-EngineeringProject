from typing import Dict, Any
from django.db import transaction
from django.utils import timezone
from ..models import Bet, Coupon, Event
from ..services.coupon_service import recalc_coupon_odds
from ..services.coupon_service import settle_coupon

class BetService:

    def _auto_settle_if_resolved(self, coupon: Coupon) -> None:
        if coupon.status == Coupon.CouponStatus.IN_PROGRESS:
            settle_coupon(coupon=coupon, data={'bets': []})

    @transaction.atomic
    def _create_bet(self, coupon: Coupon, bet_data: Dict[str, Any]) -> Bet:
        coupon = Coupon.objects.select_for_update().get(id=coupon.id, user=coupon.user)
        event = bet_data.get('event')
        event_name = bet_data.get('event_name')
        discipline = bet_data.get('discipline')
        if event is None and event_name:
            event_obj, _created = Event.objects.get_or_create(
                name=event_name,
                discipline=discipline,
                defaults={"start_time": timezone.now()},
            )
            bet_data['event'] = event_obj

        bet = Bet.objects.create(coupon=coupon, **bet_data)
        recalc_coupon_odds(coupon)
        return bet

    @transaction.atomic
    def _update_bet(self, bet: Bet, bet_data: Dict[str, Any]) -> Bet:
        coupon = Coupon.objects.select_for_update().get(id=bet.coupon.id, user=bet.coupon.user)

        result_updated = 'result' in bet_data

        for field, value in bet_data.items():
            setattr(bet, field, value)
        bet.save()
        recalc_coupon_odds(coupon)

        if result_updated:
            self._auto_settle_if_resolved(coupon)

        return bet

    @transaction.atomic
    def _delete_bet(self, bet: Bet) -> None:
        coupon = Coupon.objects.select_for_update().get(id=bet.coupon.id, user=bet.coupon.user)
        bet.delete()
        recalc_coupon_odds(coupon)

    def _list_bets(self, coupon: Coupon):
        return Bet.objects.filter(coupon=coupon).all()


_service = BetService()
def create_bet(user, coupon_id: int, data: Dict[str, Any]) -> Bet:
    coupon = Coupon.objects.get(id=coupon_id, user=user)
    return _service._create_bet(coupon=coupon, bet_data=data)

def update_bet(user, bet_id: int, data: Dict[str, Any]) -> Bet:
    bet = Bet.objects.get(id=bet_id, coupon__user=user)
    return _service._update_bet(bet=bet, bet_data=data)

def delete_bet(user, bet_id: int) -> None:
    bet = Bet.objects.get(id=bet_id, coupon__user=user)
    return _service._delete_bet(bet=bet)

def list_bets(user, coupon_id: int):
    coupon = Coupon.objects.get(id=coupon_id, user=user)
    return _service._list_bets(coupon=coupon)
