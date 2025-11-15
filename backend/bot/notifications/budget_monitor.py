import logging
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async
from django.utils.timezone import now

from users.models import TelegramUser, UserSettings
from bot.helpers.language import TELEGRAM_LANG_CACHE, get_msg, DEFAULT_LANG
from bot.helpers.data import get_monthly_budget_info

logger = logging.getLogger(__name__)


async def check_budget_exceeded(context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        users_with_budget = await sync_to_async(lambda: list(
            UserSettings.objects.filter(monthly_budget_limit__gt=0)
            .select_related('user')
            .values_list('user_id', flat=True)
        ))()

        current_date = now()
        month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        for user_id in users_with_budget:
            try:
                monthly_limit, total_spent, remaining = await sync_to_async(
                    get_monthly_budget_info, 
                    thread_sensitive=True
                )(user_id)

                if monthly_limit is None or total_spent is None:
                    continue

                if remaining < 0:
                    excess = abs(remaining)

                    try:
                        tg_profile = await sync_to_async(TelegramUser.objects.get)(user_id=user_id)
                    except TelegramUser.DoesNotExist:
                        continue

                    lang = TELEGRAM_LANG_CACHE.get(tg_profile.telegram_id, DEFAULT_LANG)

                    msg = get_msg('budget_exceeded_title', lang) + "\n\n"
                    msg += get_msg('budget_exceeded_msg', lang,
                                 spent=total_spent,
                                 limit=monthly_limit,
                                 excess=excess)

                    await context.bot.send_message(chat_id=tg_profile.telegram_id, text=msg)
                    logger.info(f"Budget exceeded notification sent to user {user_id}")
            except Exception as e:
                logger.error(f"Error checking budget for user {user_id}: {e}")
    except Exception as e:
        logger.error(f"Error in check_budget_exceeded: {e}")
