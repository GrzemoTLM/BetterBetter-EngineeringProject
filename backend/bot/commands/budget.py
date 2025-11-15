import logging
from telegram import Update
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async

from users.models import TelegramUser
from bot.helpers.language import detect_lang, get_msg, TELEGRAM_LANG_CACHE
from bot.helpers.data import get_monthly_budget_info

logger = logging.getLogger(__name__)


async def budget(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    telegram_id = update.effective_user.id
    
    try:
        telegram_profile = await sync_to_async(TelegramUser.objects.get)(telegram_id=telegram_id)
        user_id = telegram_profile.user_id
    except TelegramUser.DoesNotExist:
        await update.message.reply_text(get_msg('login_first', lang))
        return

    try:
        monthly_limit, total_spent, remaining = await sync_to_async(
            get_monthly_budget_info, 
            thread_sensitive=True
        )(user_id)

        if monthly_limit is None:
            await update.message.reply_text(get_msg('budget_no_limit', lang))
            return

        remaining_float = float(remaining)
        budget_emoji = "🟢" if remaining_float >= 0 else "🔴"

        header = f"{budget_emoji} <b>{get_msg('budget_header', lang)}</b>\n\n"
        info = get_msg('budget_info', lang, limit=monthly_limit, spent=total_spent, remaining=remaining)
        msg = header + info

        await update.message.reply_text(msg, parse_mode='HTML')
    except Exception as e:
        logger.error(f"Error in /budget: {e}", exc_info=True)
        await update.message.reply_text(get_msg('error_generic', lang))
