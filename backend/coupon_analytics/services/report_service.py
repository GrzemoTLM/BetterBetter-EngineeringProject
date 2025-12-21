"""
Service for generating and managing periodic reports.
"""
import logging
import os
import requests
from datetime import datetime, timedelta
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from coupon_analytics.models import Report
from coupons.models import Coupon

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN') or getattr(settings, 'TELEGRAM_BOT_TOKEN', None)


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
        filters = query.filters
        if 'status' in filters:
            coupons = coupons.filter(status=filters['status'])
        if 'coupon_type' in filters:
            coupons = coupons.filter(coupon_type=filters['coupon_type'])

    total_coupons = coupons.count()
    won_coupons = coupons.filter(status='won').count()
    lost_coupons = coupons.filter(status='lost').count()
    in_progress = coupons.filter(status='in_progress').count()

    total_stake = sum(
        c.bet_stake for c in coupons if c.bet_stake
    ) or Decimal('0')

    total_payout = sum(
        c.balance for c in coupons
        if c.balance is not None and c.status == 'won'
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
        next_run = base_time + timedelta(days=30)
    elif frequency == Report.Frequency.YEARLY:
        next_run = base_time + timedelta(days=365)
    else:
        next_run = base_time + timedelta(days=1)

    return next_run


def format_report_message(report_data: dict) -> str:
    """Formatuj raport do wiadomości Telegram."""
    frequency = report_data['frequency']
    data = report_data['data']
    generated_at = report_data['generated_at']

    freq_emoji = {
        'DAILY': '📅',
        'WEEKLY': '📊',
        'MONTHLY': '📈',
        'YEARLY': '🏆',
    }.get(frequency, '📋')

    lines = [
        f"{freq_emoji} <b>RAPORT {frequency}</b>",
        "",
        "📊 <b>Statystyki kuponów:</b>",
        f"  Razem: {data['total_coupons']}",
        f"  Wygrane: {data['won']} ✅",
        f"  Przegrane: {data['lost']} ❌",
        f"  W trakcie: {data['in_progress']} ⏳",
        "",
        "💰 <b>Finanse:</b>",
        f"  Stawki: {data['total_stake']} PLN",
        f"  Wygrane: {data['total_payout']} PLN",
        f"  Zysk/Strata: {data['profit']} PLN",
        "",
        "📈 <b>Wskaźniki:</b>",
        f"  Win rate: {data['win_rate']}%",
        f"  ROI: {data['roi']}%",
        "",
        f"⏰ Wygenerowano: {generated_at[:19]}",
    ]

    return "\n".join(lines)


def send_telegram_message(chat_id: int, text: str) -> bool:
    """Wyślij wiadomość do Telegrama przez API."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("[REPORTS] TELEGRAM_BOT_TOKEN not configured")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            logger.info(f"[REPORTS] Message sent to chat_id {chat_id}")
            return True
        else:
            logger.error(f"[REPORTS] Telegram API error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"[REPORTS] Error sending to Telegram: {e}")
        return False


def send_pending_reports() -> None:
    """
    Sprawdź wszystkie raporty gdzie is_active=True i next_run <= teraz.
    Wyślij report do Telegrama i ustaw następny next_run.
    """
    from users.models import TelegramUser

    now = timezone.now()

    pending_reports = Report.objects.filter(
        is_active=True,
        next_run__lte=now
    ).select_related('user')

    logger.info(f"[REPORTS] Found {pending_reports.count()} pending reports to send")

    for report in pending_reports:
        try:
            try:
                tg_user = TelegramUser.objects.get(user=report.user)
            except TelegramUser.DoesNotExist:
                logger.warning(f"[REPORTS] User {report.user.id} has no Telegram profile, skipping")
                continue

            report_data = generate_report_data(report)

            message = format_report_message(report_data)

            sent = send_telegram_message(tg_user.telegram_id, message)

            if sent:
                report.next_run = calculate_next_run(report, now)
                report.save(update_fields=['next_run'])
                logger.info(f"[REPORTS] Report ID {report.id} sent, next_run set to {report.next_run}")
            else:
                logger.error(f"[REPORTS] Failed to send report ID {report.id}")

        except Exception as e:
            logger.error(f"[REPORTS] Error sending report ID {report.id}: {e}", exc_info=True)


