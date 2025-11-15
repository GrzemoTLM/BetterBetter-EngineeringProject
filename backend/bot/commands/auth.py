import logging
from telegram import Update
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async

from users.models import TelegramUser
from users.services.telegram_service import TelegramService
from bot.helpers.language import detect_lang, get_msg, TELEGRAM_LANG_CACHE

logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    user = update.effective_user
    telegram_id = user.id
    try:
        profile_exists = await sync_to_async(TelegramUser.objects.filter(telegram_id=telegram_id).exists)()
        msg_key = 'start_existing' if profile_exists else 'start_new'
        welcome_message = get_msg(msg_key, lang, first_name=user.first_name)
        await update.message.reply_text(welcome_message, parse_mode='HTML')
        logger.info(f"User {user.first_name} ({telegram_id}) started the bot lang={lang}")
    except Exception as e:
        logger.error(f"Error in /start: {e}")
        await update.message.reply_text(get_msg('error_generic', lang))


async def login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    telegram_id = update.effective_user.id
    telegram_username = update.effective_user.username or "no_username"
    
    if not context.args:
        await update.message.reply_text(get_msg('login_usage', lang))
        return
    
    code = context.args[0].upper()
    try:
        telegram_user = await sync_to_async(TelegramService.login_via_code)(
            telegram_id=telegram_id,
            telegram_username=telegram_username,
            code=code
        )
        await update.message.reply_text(get_msg('login_success', lang, username=telegram_user.user.username))
        logger.info(f"User {telegram_user.user.username} (Telegram: {telegram_id}) logged in successfully lang={lang}")
    except ValueError as e:
        lower = str(e).lower()
        if 'expired' in lower:
            await update.message.reply_text(get_msg('login_expired', lang))
        elif 'already connected' in lower:
            await update.message.reply_text(get_msg('login_already_connected', lang))
        else:
            await update.message.reply_text(get_msg('login_invalid', lang))
        logger.warning(f"Login attempt failed for Telegram {telegram_id}: {e}")
    except Exception as e:
        logger.error(f"Error in /login: {e}")
        await update.message.reply_text(get_msg('error_generic', lang))
