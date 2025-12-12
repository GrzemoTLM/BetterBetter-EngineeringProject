import logging
from datetime import timedelta
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async
from django.utils.timezone import now

from users.models import TelegramUser, UserSettings
from bot.helpers.language import TELEGRAM_LANG_CACHE, get_msg, DEFAULT_LANG
from bot.helpers.data import get_monthly_budget_info

logger = logging.getLogger(__name__)

# Minimalna przerwa między powiadomieniami o budżecie (24 godziny)
BUDGET_NOTIFICATION_COOLDOWN = timedelta(hours=24)


async def check_budget_exceeded(context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        # Pobierz użytkowników z ustawionym budżetem
        users_settings = await sync_to_async(lambda: list(
            UserSettings.objects.filter(monthly_budget_limit__gt=0)
            .select_related('user')
        ))()

        current_time = now()

        for settings in users_settings:
            user_id = settings.user_id
            try:
                # Sprawdź czy minęła doba od ostatniego powiadomienia
                if settings.budget_exceeded_notified_at:
                    time_since_last = current_time - settings.budget_exceeded_notified_at
                    if time_since_last < BUDGET_NOTIFICATION_COOLDOWN:
                        # Jeszcze nie minęła doba - pomiń
                        continue

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

                    # Zapisz czas wysłania powiadomienia
                    await sync_to_async(lambda: UserSettings.objects.filter(user_id=user_id).update(
                        budget_exceeded_notified_at=current_time
                    ))()

                    logger.info(f"Budget exceeded notification sent to user {user_id}")
            except Exception as e:
                logger.error(f"Error checking budget for user {user_id}: {e}")
    except Exception as e:
        logger.error(f"Error in check_budget_exceeded: {e}")
