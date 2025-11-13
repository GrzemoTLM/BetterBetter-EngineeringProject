from dataclasses import dataclass, asdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Dict, Any
from django.db.models import Sum, Q, Avg

from coupons.models import Coupon


@dataclass
class CouponAnalyticsResult:
    total_coupons: int
    finished_coupons: int
    in_progress_coupons: int
    won_coupons: int
    lost_coupons: int
    canceled_coupons: int
    total_stake: Decimal
    realized_profit: Decimal
    roi: Optional[Decimal]
    yield_: Optional[Decimal]
    win_rate: Optional[Decimal]
    avg_stake: Optional[Decimal]
    avg_multiplier: Optional[Decimal]

    def to_representation(self) -> Dict[str, Any]:
        data = asdict(self)
        for k in ["total_stake", "realized_profit", "roi", "yield_", "win_rate", "avg_stake", "avg_multiplier"]:
            v = data.get(k)
            if isinstance(v, Decimal):
                if k == "roi":
                    quant = Decimal('0.0001')
                elif k == "yield_":
                    quant = Decimal('0.01')
                elif k == "win_rate":
                    quant = Decimal('0.0001')
                else:
                    quant = Decimal('0.01')
                data[k] = str(v.quantize(quant, rounding=ROUND_HALF_UP))
            elif v is None:
                data[k] = None
        data["yield"] = data.pop("yield_")
        return data


def _percent(numerator: Decimal, denominator: Decimal) -> Optional[Decimal]:
    if denominator is None or denominator == 0:
        return None
    return (numerator / denominator).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)


class AnalyticsService:

    def _summary_from_queryset(self, qs) -> CouponAnalyticsResult:
        total_coupons = qs.count()
        finished_filter = Q(status=Coupon.CouponStatus.WON) | Q(status=Coupon.CouponStatus.LOST) | Q(status=Coupon.CouponStatus.CANCELED)
        result_filter = Q(status=Coupon.CouponStatus.WON) | Q(status=Coupon.CouponStatus.LOST)

        finished_coupons = qs.filter(finished_filter).count()
        in_progress_coupons = qs.filter(status=Coupon.CouponStatus.IN_PROGRESS).count()
        won_coupons = qs.filter(status=Coupon.CouponStatus.WON).count()
        lost_coupons = qs.filter(status=Coupon.CouponStatus.LOST).count()
        canceled_coupons = qs.filter(status=Coupon.CouponStatus.CANCELED).count()

        stake_agg = qs.filter(result_filter).aggregate(total_stake=Sum('bet_stake'))
        total_stake = stake_agg['total_stake'] or Decimal('0.00')

        profit_agg = qs.filter(result_filter).aggregate(realized_profit=Sum('balance'))
        realized_profit = profit_agg['realized_profit'] or Decimal('0.00')

        avg_agg = qs.aggregate(
            avg_stake=Avg('bet_stake'),
            avg_multiplier=Avg('multiplier'),
        )

        roi = (realized_profit / total_stake) if total_stake else None
        yield_percent = (roi * Decimal('100')) if roi is not None else None
        win_rate = (Decimal(won_coupons) / Decimal(won_coupons + lost_coupons)).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP) if (won_coupons + lost_coupons) > 0 else None

        return CouponAnalyticsResult(
            total_coupons=total_coupons,
            finished_coupons=finished_coupons,
            in_progress_coupons=in_progress_coupons,
            won_coupons=won_coupons,
            lost_coupons=lost_coupons,
            canceled_coupons=canceled_coupons,
            total_stake=Decimal(total_stake),
            realized_profit=Decimal(realized_profit),
            roi=roi if roi is not None else None,
            yield_=yield_percent if yield_percent is not None else None,
            win_rate=win_rate if win_rate is not None else None,
            avg_stake=Decimal(avg_agg['avg_stake']) if avg_agg['avg_stake'] is not None else None,
            avg_multiplier=Decimal(avg_agg['avg_multiplier']) if avg_agg['avg_multiplier'] is not None else None,
        )

    def coupon_summary(self, *, user, date_from=None, date_to=None) -> CouponAnalyticsResult:
        qs = Coupon.objects.filter(user=user)
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        return self._summary_from_queryset(qs)

_service = AnalyticsService()


def get_coupon_analytics_summary(user, *, date_from=None, date_to=None) -> Dict[str, Any]:
    result = _service.coupon_summary(user=user, date_from=date_from, date_to=date_to)
    return result.to_representation()


def get_coupon_analytics_summary_for_queryset(qs) -> Dict[str, Any]:
    result = _service._summary_from_queryset(qs)
    return result.to_representation()
