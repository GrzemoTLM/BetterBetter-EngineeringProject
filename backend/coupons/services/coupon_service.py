from typing import List, Dict, Optional, Any
from django.db import transaction
from django.db.models import QuerySet, F
from ..models import Coupon, Bet, Event, Discipline
from decimal import Decimal, ROUND_HALF_UP
from common.choices import CouponType


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
            total_odds *= self.bet_returned_odds(bet)
        coupon.multiplier = self.quantize2_odds(total_odds)
        bets_count = Bet.objects.filter(coupon=coupon).count()
        new_type = CouponType.SOLO if bets_count <= 1 else CouponType.AKO
        update_fields = ['multiplier']

        if coupon.coupon_type != new_type:
            coupon.coupon_type = new_type
            update_fields.append('coupon_type')
        coupon.save(update_fields=update_fields)
        return coupon

    @transaction.atomic
    def settle_coupon(self, coupon: Coupon, data: Dict[str, Any]) -> Coupon:

        bets_data = data.get('bets', [])

        for bet_data in bets_data:
            bet_id = bet_data.get('bet_id')
            result = bet_data.get('result')

            if bet_id and result:
                try:
                    bet = Bet.objects.get(id=bet_id, coupon=coupon)
                    bet.result = result
                    bet.save(update_fields=['result'])
                except Bet.DoesNotExist:
                    pass

        self.recalc_coupon_odds(coupon)
        all_bets = Bet.objects.filter(coupon=coupon)
        bets_count = all_bets.count()

        if bets_count == 0:
            coupon.status = Coupon.CouponStatus.CANCELED
            coupon.balance = Decimal('0.00')
        else:
            lost_bets = all_bets.filter(result=Bet.BetResult.LOST).count()

            if lost_bets > 0:
                coupon.status = Coupon.CouponStatus.LOST
                coupon.balance = -coupon.bet_stake
            else:
                unresolved_bets = all_bets.filter(result__isnull=True).count()

                if unresolved_bets > 0:
                    coupon.status = Coupon.CouponStatus.IN_PROGRESS
                else:

                    won_bets = all_bets.filter(result=Bet.BetResult.WIN).count()
                    canceled_bets = all_bets.filter(result=Bet.BetResult.CANCELED).count()

                    if won_bets + canceled_bets == bets_count:
                        coupon.status = Coupon.CouponStatus.WON

                        try:
                            tax_mult = Decimal(str(coupon.bookmaker_account.bookmaker.tax_multiplier))
                        except Exception:
                            tax_mult = Decimal('1.00')

                        gross_payout = coupon.bet_stake * coupon.multiplier * tax_mult

                        try:
                            currency_code = coupon.bookmaker_account.currency.code
                            if currency_code == 'PLN' and gross_payout > Decimal('2280.00'):
                                gross_payout = gross_payout * (Decimal('1.00') - Decimal('0.10'))
                        except Exception:
                            pass

                        coupon.balance = (gross_payout - coupon.bet_stake).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                    else:
                        coupon.status = Coupon.CouponStatus.IN_PROGRESS

        coupon.save()

        if coupon.bookmaker_account and coupon.status in [Coupon.CouponStatus.WON, Coupon.CouponStatus.LOST]:
            bookmaker_account = coupon.bookmaker_account
            balance_change = coupon.balance

            from finances.models import BookmakerAccountModel
            BookmakerAccountModel.objects.filter(id=bookmaker_account.id).update(
                balance=F('balance') + Decimal(str(balance_change))
            )

        return coupon

    @transaction.atomic
    def create_coupon(self, *, user, data: Dict[str, Any]) -> Coupon:
        bets_data: List[Dict[str, Any]] = data.pop('bets', [])
        placed_at = data.pop('placed_at', None)

        if data.get('multiplier') is None:
            data['multiplier'] = Decimal('1.00')
            for b in bets_data:
                data['multiplier'] *= Decimal(b['odds'])
            data['multiplier'] = self.quantize2_odds(data['multiplier'])

        if placed_at is not None:
            data['created_at'] = placed_at

        coupon = Coupon.objects.create(user=user, **data)

        default_discipline = Discipline.objects.filter(code='SOCCER').first()

        prepared_bets: List[Bet] = []
        for bet_data in bets_data:
            start_time = bet_data.pop('start_time', None)

            event = bet_data.get('event')
            discipline = bet_data.get('discipline')

            if discipline is None and default_discipline:
                discipline = default_discipline
                bet_data['discipline'] = discipline

            if event is None and bet_data.get('event_name') and start_time is not None:
                if discipline is not None:
                    if isinstance(discipline, (int, str)):
                        discipline = Discipline.objects.filter(pk=discipline).first() or default_discipline
                    if discipline:
                        event, _created = Event.objects.get_or_create(
                            name=bet_data['event_name'],
                            start_time=start_time,
                            discipline=discipline,
                        )
                        bet_data['event'] = event

            event = bet_data.get('event')
            if event is not None and bet_data.get('discipline') is None:
                bet_data['discipline'] = event.discipline

            prepared_bets.append(Bet(coupon=coupon, **bet_data))

        if prepared_bets:
            Bet.objects.bulk_create(prepared_bets)
            self.recalc_coupon_odds(coupon)
        else:
            if coupon.coupon_type != CouponType.SOLO:
                coupon.coupon_type = CouponType.SOLO
                coupon.save(update_fields=['coupon_type'])

        if coupon.bookmaker_account:
            from finances.models import BookmakerAccountModel
            BookmakerAccountModel.objects.filter(id=coupon.bookmaker_account.id).update(
                balance=F('balance') - coupon.bet_stake
            )

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
        locked_coupon = Coupon.objects.select_for_update().get(id=coupon.id, user=coupon.user)

        if coupon.bookmaker_account and coupon.status == Coupon.CouponStatus.IN_PROGRESS:
            from finances.models import BookmakerAccountModel
            BookmakerAccountModel.objects.filter(id=coupon.bookmaker_account.id).update(
                balance=F('balance') + coupon.bet_stake
            )

        locked_coupon.delete()

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


def settle_coupon(coupon: Coupon, data: Dict[str, Any]) -> Coupon:
    return _service.settle_coupon(coupon=coupon, data=data)

