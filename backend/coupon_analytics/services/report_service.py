"""
Service for generating and managing periodic reports.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from coupon_analytics.models import Report, AnalyticsQuery
from coupons.models import Coupon


def get_coupon_stats_for_period(user, start_date, end_date, query=None):
    """
    Get coupon statistics for a given period.

    Args:
        user: User instance
        start_date: Start date (datetime or date)
        end_date: End date (datetime or date)
        query: Optional AnalyticsQuery filter

    Returns:
        dict with statistics
    """
    coupons = Coupon.objects.filter(
        user=user,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )

    if query and query.filters:
        # Apply query filters if provided
        filters = query.filters
        if 'status' in filters:
            coupons = coupons.filter(status=filters['status'])
        if 'coupon_type' in filters:
            coupons = coupons.filter(coupon_type=filters['coupon_type'])

    total_coupons = coupons.count()
    won_coupons = coupons.filter(status='won').count()
    lost_coupons = coupons.filter(status='lost').count()
    in_progress = coupons.filter(status='in_progress').count()

    # Calculate totals
    total_stake = sum(
        c.bet_stake for c in coupons if c.bet_stake
    ) or Decimal('0')

    total_payout = sum(
        c.realized_profit + c.bet_stake for c in coupons
        if c.realized_profit is not None and c.bet_stake
    ) or Decimal('0')

    profit = total_payout - total_stake

    win_rate = (won_coupons / total_coupons * 100) if total_coupons > 0 else 0
    roi = (profit / total_stake * 100) if total_stake > 0 else 0

    return {
        'period_start': start_date,
        'period_end': end_date,
        'total_coupons': total_coupons,
        'won': won_coupons,
        'lost': lost_coupons,
        'in_progress': in_progress,
        'total_stake': str(total_stake),
        'total_payout': str(total_payout),
        'profit': str(profit),
        'win_rate': round(win_rate, 2),
        'roi': round(roi, 2),
    }


def generate_daily_report(user, query=None):
    """Generate daily report for yesterday."""
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)

    return get_coupon_stats_for_period(user, yesterday, yesterday, query)


def generate_weekly_report(user, query=None):
    """Generate weekly report for last 7 days."""
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    return get_coupon_stats_for_period(user, week_ago, today, query)


def generate_monthly_report(user, query=None):
    """Generate monthly report for last 30 days."""
    today = timezone.now().date()
    month_ago = today - timedelta(days=30)

    return get_coupon_stats_for_period(user, month_ago, today, query)


def generate_yearly_report(user, query=None):
    """Generate yearly report for last 365 days."""
    today = timezone.now().date()
    year_ago = today - timedelta(days=365)

    return get_coupon_stats_for_period(user, year_ago, today, query)


def generate_report_data(report):
    """
    Generate report data based on report frequency.

    Args:
        report: Report instance

    Returns:
        dict with report data
    """
    frequency = report.frequency
    user = report.user
    query = report.query

    if frequency == Report.Frequency.DAILY:
        data = generate_daily_report(user, query)
    elif frequency == Report.Frequency.WEEKLY:
        data = generate_weekly_report(user, query)
    elif frequency == Report.Frequency.MONTHLY:
        data = generate_monthly_report(user, query)
    elif frequency == Report.Frequency.YEARLY:
        data = generate_yearly_report(user, query)
    else:
        data = generate_monthly_report(user, query)

    return {
        'report_id': report.id,
        'frequency': frequency,
        'generated_at': timezone.now().isoformat(),
        'delivery_methods': report.delivery_methods or [report.delivery_method],
        'data': data,
    }


def should_send_report(report):
    """
    Check if report should be sent now based on next_run.

    Args:
        report: Report instance

    Returns:
        bool: True if report should be sent
    """
    if not report.next_run:
        return False

    return timezone.now() >= report.next_run


def calculate_next_run(report, base_time=None):
    """
    Calculate next run time based on frequency.

    Args:
        report: Report instance
        base_time: Base time to calculate from (default: now)

    Returns:
        datetime: Next run time
    """
    if not base_time:
        base_time = timezone.now()

    frequency = report.frequency

    if frequency == Report.Frequency.DAILY:
        next_run = base_time + timedelta(days=1)
    elif frequency == Report.Frequency.WEEKLY:
        next_run = base_time + timedelta(weeks=1)
    elif frequency == Report.Frequency.MONTHLY:
        # Add ~30 days (not exact month due to date variations)
        next_run = base_time + timedelta(days=30)
    elif frequency == Report.Frequency.YEARLY:
        next_run = base_time + timedelta(days=365)
    else:
        next_run = base_time + timedelta(days=1)

    return next_run

