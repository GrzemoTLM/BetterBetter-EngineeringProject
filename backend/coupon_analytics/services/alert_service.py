from decimal import Decimal
from datetime import datetime, time, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Sum
from coupon_analytics.services.analytics_service import get_coupon_analytics_summary
from coupon_analytics.models import AlertRule, AlertEvent
from coupons.models.coupon import Coupon

User = get_user_model()


_COMPARATORS = {
    'lt': lambda a, b: a is not None and b is not None and a < b,
    'lte': lambda a, b: a is not None and b is not None and a <= b,
    'gt': lambda a, b: a is not None and b is not None and a > b,
    'gte': lambda a, b: a is not None and b is not None and a >= b,
    'eq': lambda a, b: a is not None and b is not None and a == b,
}


def _dec_or_none(val) -> Decimal | None:
    if val is None:
        return None
    try:
        return Decimal(str(val))
    except Exception:
        return None


def _compute_metric_value(rule: AlertRule, *, user: User, start: datetime, end: datetime) -> Decimal | None:
    metric = (rule.metric or '').lower()

    if metric in {'yield', 'roi'}:
        summary = get_coupon_analytics_summary(user, date_from=start, date_to=end)
        key = 'yield' if metric == 'yield' else 'roi'
        return _dec_or_none(summary.get(key))

    if metric == 'loss':
        # Licz NETTO sumę balance WSZYSTKICH kuponów (wygrane i przegranym)
        # balance może być ujemny (strata) lub dodatni (zysk)
        agg = Coupon.objects.filter(
            user=user,
            created_at__gte=start,
            created_at__lte=end,
            status__in=[Coupon.CouponStatus.LOST, Coupon.CouponStatus.WON]  # ← Oba!
        ).aggregate(total_balance=Sum('balance'))

        total_balance = agg['total_balance']
        if total_balance is None:
            return Decimal('0.00')

        try:
            d = Decimal(str(total_balance))
        except Exception:
            return None

        # Zwróć wartość bezwzględną TYLKO jeśli ujemna (strata)
        # Jeśli dodatnia (zysk), zwróć 0 (brak straty)
        # np. -150 → 150, 100 → 0
        if d < 0:
            return abs(d)
        else:
            return Decimal('0.00')

    if metric == 'streak_loss':
        qs = Coupon.objects.filter(user=user).order_by('-created_at').values_list('status', flat=True)
        streak = 0
        for st in qs:
            if st == Coupon.CouponStatus.CANCELED:
                continue
            if st == Coupon.CouponStatus.LOST:
                streak += 1
                continue
            break
        return Decimal(streak)

    return None


def _render_message(rule: AlertRule, *, metric_value: Decimal | None, start: datetime, end: datetime) -> str:
    msg = rule.message or ''
    repl = {
        '{metric}': rule.metric,
        '{value}': str(metric_value) if metric_value is not None else '∅',
        '{threshold}': str(rule.threshold_value),
        '{start}': start.date().isoformat(),
        '{end}': end.date().isoformat(),
    }
    for k, v in repl.items():
        msg = msg.replace(k, v)
    if not msg:
        msg = f"Alert: {rule.metric} {rule.comparator} {rule.threshold_value} (okno {start.date()}–{end.date()})"
    return msg


def _get_calendar_period(now: datetime, window_days: int) -> tuple[datetime, datetime]:

    end_dt = datetime.combine(now.date(), time.max, tzinfo=now.tzinfo)

    start_date = (now.date() - timedelta(days=window_days - 1))
    start_dt = datetime.combine(start_date, time.min, tzinfo=now.tzinfo)

    return start_dt, end_dt


def evaluate_alert_rules_for_user(user: User) -> None:
    now = timezone.now()
    rules = AlertRule.objects.filter(user=user, is_active=True).exclude(metric='streak_loss')
    for rule in rules:
        window_days = rule.window_days or 30
        start_dt, end_dt = _get_calendar_period(now, window_days)

        metric = (rule.metric or '').lower()

        if metric == 'streak_loss':
            continue

        value = _compute_metric_value(rule, user=user, start=start_dt, end=end_dt)
        comp = _COMPARATORS.get(rule.comparator)

        if comp is None or value is None:
            continue
        threshold = _dec_or_none(rule.threshold_value)

        condition_met = comp(value, threshold)
        existing_alert = AlertEvent.objects.filter(rule=rule, window_start=start_dt, window_end=end_dt).first()

        if condition_met:
            if existing_alert:
                if metric == 'loss':
                    existing_alert.delete()
                else:
                    if Decimal(str(existing_alert.metric_value or 0)) != value:
                        existing_alert.delete()
                    else:
                        continue

            rendered = _render_message(rule, metric_value=value, start=start_dt, end=end_dt)
            AlertEvent.objects.create(
                rule=rule,
                user=user,
                metric=rule.metric,
                comparator=rule.comparator,
                threshold_value=rule.threshold_value,
                metric_value=value,
                window_start=start_dt,
                window_end=end_dt,
                message_rendered=rendered,
                sent_at=None,
            )
        else:
            if existing_alert:
                existing_alert.delete()

def notify_yield_alerts_on_coupon_settle(user: User) -> None:
    evaluate_alert_rules_for_user(user)
