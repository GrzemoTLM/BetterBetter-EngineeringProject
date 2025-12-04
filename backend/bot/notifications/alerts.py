import logging
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async
from django.utils import timezone

from users.models import TelegramUser
from coupon_analytics.models import AlertEvent
from bot.helpers.language import TELEGRAM_LANG_CACHE, get_msg, DEFAULT_LANG
from bot.config import BOX_WIDTH

logger = logging.getLogger(__name__)


def _build_box(lines: list[str], title: str = 'OSTRZEŻENIE') -> str:
    top = f"#{'#' * BOX_WIDTH}#"
    title_line = f"#{title.center(BOX_WIDTH)}#"
    sep = f"#{'#' * BOX_WIDTH}#"

    body = []
    for ln in lines:
        for sub in ln.split('\n'):
            centered = sub.center(BOX_WIDTH)
            body.append(f"#{centered}#")

    return '\n'.join([top, title_line, sep, *body, sep])


def format_alert_event(ev: AlertEvent, lang: str | None = None) -> str:
    from bot.config import SUPPORTED_LANGS, DEFAULT_LANG
    
    lang = lang if lang in SUPPORTED_LANGS else DEFAULT_LANG
    metric_emoji = {
        'yield': '📈', 'roi': '📊', 'loss': '🔻', 'streak_loss': '🟥',
    }.get((ev.metric or '').lower(), '🚨')

    if (ev.metric or '').lower() == 'streak_loss':
        streak_num = str(int(float(ev.metric_value or 0)))
        threshold_num = str(int(float(ev.threshold_value or 0)))
        date_str = ev.window_start.strftime('%Y-%m-%d %H:%M') if ev.window_start else 'N/A'
        lines = [
            f"{metric_emoji} PRZEGRANYCH Z RZĘDU" if lang == 'pl' else f"{metric_emoji} LOSSES IN A ROW",
            f"Liczba: {streak_num}",
            f"Próg: {threshold_num}",
            f"Data: {date_str}",
        ]
    else:
        lines = [
            f"{metric_emoji} {ev.metric.upper()} {ev.comparator} {ev.threshold_value}",
            ("Value" if lang == 'en' else "Wartość") + f": {ev.metric_value}",
            ("Window" if lang == 'en' else "Okno") + f": {ev.window_start.date()} – {ev.window_end.date()}",
        ]

    title = str(get_msg('alert_title', lang))
    return _build_box(lines, title=title)


async def send_pending_alert_events(context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Wysyłaj pending alert events I raporty do Telegrama.
    """
    try:
        # 1. Wysyłaj Alert Events
        pending_events = await sync_to_async(
            lambda: list(AlertEvent.objects.filter(sent_at__isnull=True).select_related('user', 'rule'))
        )()
        
        if pending_events:
            logger.info(f"[ALERTS] Found {len(pending_events)} pending alert events")

            for ev in pending_events:
                try:
                    tg_profile = await sync_to_async(TelegramUser.objects.get)(user=ev.user)
                except TelegramUser.DoesNotExist:
                    continue

                lang = TELEGRAM_LANG_CACHE.get(tg_profile.telegram_id, DEFAULT_LANG)
                base_msg = format_alert_event(ev, lang)
                await context.bot.send_message(chat_id=tg_profile.telegram_id, text=base_msg)
                ev.sent_at = timezone.now()
                await sync_to_async(ev.save)(update_fields=['sent_at'])
                logger.info(f"[ALERTS] Sent AlertEvent {ev.id} to user {ev.user.id}")

        # 2. Wysyłaj Raporty (z bot.notifications.reports)
        from bot.notifications.reports import send_pending_reports
        await send_pending_reports(context)

    except Exception as e:
        logger.error(f"Error in send_pending_alert_events: {e}", exc_info=True)
