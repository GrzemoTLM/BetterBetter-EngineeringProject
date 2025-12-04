"""
Periodic Reports notifications - wysyłanie raportów do Telegrama.
"""
import logging
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async
from django.utils import timezone

from users.models import TelegramUser
from coupon_analytics.models import Report
from coupon_analytics.services.report_service import generate_report_data, calculate_next_run
from bot.helpers.language import DEFAULT_LANG, TELEGRAM_LANG_CACHE

logger = logging.getLogger(__name__)


def _format_report_message(report_data: dict) -> str:
    """
    Formatuj raport do wiadomości Telegram.
    
    Args:
        report_data: dict z danymi raportu (z generate_report_data)
    
    Returns:
        sformatowana wiadomość
    """
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

        f"{freq_emoji} RAPORT {frequency}",
        "",
        f"📊 Statystyki kuponów:",
        f"  Razem: {data['total_coupons']}",
        f"  Wygrane: {data['won']} ✅",
        f"  Przegrane: {data['lost']} ❌",
        f"  W trakcie: {data['in_progress']} ⏳",
        "",
        f"💰 Finanse:",
        f"  Stawki: {data['total_stake']} PLN",
        f"  Wygrane: {data['total_payout']} PLN",
        f"  Zysk/Strata: {data['profit']} PLN",
        "",
        f"📈 Wskaźniki:",
        f"  Win rate: {data['win_rate']}%",
        f"  ROI: {data['roi']}%",
        "",
        f"⏰ Wygenerowano: {generated_at[:19]}",
    ]

    top = "═" * 40
    bottom = "═" * 40

    return f"{top}\n" + "\n".join(lines) + f"\n{bottom}"


async def send_pending_reports(context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        now = timezone.now()

        pending_reports = await sync_to_async(
            lambda: list(Report.objects.filter(is_active=True, next_run__lte=now).select_related('user'))
        )()

        if not pending_reports:
            return

        logger.info(f"[REPORTS] Found {len(pending_reports)} reports to send")

        for report in pending_reports:
            try:
                tg_profile = await sync_to_async(TelegramUser.objects.get)(user=report.user)
            except TelegramUser.DoesNotExist:
                logger.warning(f"[REPORTS] User {report.user.id} has no Telegram profile, skipping report {report.id}")
                continue

            try:
                report_data = await sync_to_async(generate_report_data)(report)
                message = _format_report_message(report_data)

                lang = TELEGRAM_LANG_CACHE.get(tg_profile.telegram_id, DEFAULT_LANG)
                await context.bot.send_message(
                    chat_id=tg_profile.telegram_id,
                    text=message,
                    parse_mode='HTML'
                )

                logger.info(f"[REPORTS] Report {report.id} sent to user {report.user.id}")

                next_run = await sync_to_async(calculate_next_run)(report, now)
                await sync_to_async(
                    lambda: Report.objects.filter(id=report.id).update(next_run=next_run)
                )()

                logger.info(f"[REPORTS] Report {report.id} next_run updated to {next_run}")

            except Exception as e:
                logger.error(f"[REPORTS] Error sending report {report.id}: {e}", exc_info=True)

    except Exception as e:
        logger.error(f"[REPORTS] Error in send_pending_reports: {e}", exc_info=True)
