import logging
from telegram import Update
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async

from users.models import TelegramUser
from bot.helpers.language import detect_lang, get_msg, TELEGRAM_LANG_CACHE

logger = logging.getLogger(__name__)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    await update.message.reply_text(get_msg('help', lang))


async def refresh(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    telegram_id = update.effective_user.id
    current_username = update.effective_user.username or ""
    
    try:
        telegram_profile = await sync_to_async(TelegramUser.objects.get)(telegram_id=telegram_id)
        old_username = telegram_profile.telegram_username or ""
        
        if not current_username:
            await update.message.reply_text(get_msg('refresh_no_username', lang))
            return
        
        if current_username == old_username:
            await update.message.reply_text(get_msg('refresh_unchanged', lang, username=current_username))
            return
        
        telegram_profile.telegram_username = current_username
        await sync_to_async(telegram_profile.save)(update_fields=['telegram_username'])
        await update.message.reply_text(get_msg('refresh_updated', lang, old=old_username or '∅', new=current_username))
    except TelegramUser.DoesNotExist:
        await update.message.reply_text(get_msg('login_first', lang))
    except Exception as e:
        logger.error(f"Error in /refresh: {e}")
        await update.message.reply_text(get_msg('error_generic', lang))
