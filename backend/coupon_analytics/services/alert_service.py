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
        agg = Coupon.objects.filter(user=user, created_at__gte=start, created_at__lte=end, status=Coupon.CouponStatus.LOST).aggregate(total_loss=Sum('balance'))
        total_loss = agg['total_loss']
        if total_loss is None:
            return Decimal('0.00')
        try:
            d = Decimal(str(total_loss))
        except Exception:
            return None
        return -d if d < 0 else Decimal('0.00')

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


def evaluate_alert_rules_for_user(user: User) -> None:
    now = timezone.now()
    rules = AlertRule.objects.filter(user=user, is_active=True)
    for rule in rules:
        days = rule.window_days or 30
        start = now - timedelta(days=days)
        start_dt = datetime.combine(start.date(), time.min, tzinfo=now.tzinfo)
        end_dt = datetime.combine(now.date(), time.max, tzinfo=now.tzinfo)

        value = _compute_metric_value(rule, user=user, start=start_dt, end=end_dt)
        comp = _COMPARATORS.get(rule.comparator)
        if comp is None or value is None:
            continue
        threshold = _dec_or_none(rule.threshold_value)
        if not comp(value, threshold):
            continue

        if rule.metric == 'streak_loss':
            existing = AlertEvent.objects.filter(rule=rule, metric='streak_loss').order_by('-triggered_at').first()
            if existing:
                interrupted = Coupon.objects.filter(
                    user=user,
                    created_at__gt=existing.triggered_at,
                    status__in=[Coupon.CouponStatus.WON, Coupon.CouponStatus.IN_PROGRESS]
                ).exists()
                if not interrupted:
                    if value > existing.metric_value:
                        new_msg = _render_message(rule, metric_value=value, start=start_dt, end=end_dt)
                        existing.metric_value = value
                        existing.message_rendered = new_msg
                        existing.window_start = start_dt
                        existing.window_end = end_dt
                        existing.save(update_fields=['metric_value', 'message_rendered', 'window_start', 'window_end'])
                    continue

        if AlertEvent.objects.filter(rule=rule, window_start=start_dt, window_end=end_dt).exists():
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
        )

def notify_yield_alerts_on_coupon_settle(user: User) -> None:
    evaluate_alert_rules_for_user(user)
