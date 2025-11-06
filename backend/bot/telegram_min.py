import os
import logging
import django
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv
from decimal import Decimal
from asgiref.sync import sync_to_async

load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings_bot')
django.setup()

from users.models import TelegramUser, User, TelegramAuthCode
from users.services.telegram_service import TelegramService
from finances.models import BookmakerAccountModel
from finances.services.bookmaker_account_service import get_total_balance

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    telegram_id = user.id

    try:
        profile_exists = await sync_to_async(
            TelegramUser.objects.filter(telegram_id=telegram_id).exists
        )()

        if profile_exists:
            welcome_message = (
                f"Hello {user.first_name}! 👋\n\n"
                f"You are already logged in!\n\n"
                f"Available commands:\n"
                f"/balance - Check your balance\n"
                f"/help - Help\n"
            )
        else:
            welcome_message = (
                f"Hello {user.first_name}! 👋\n\n"
                f"Welcome to BetBetter!\n\n"
                f"To log in:\n"
                f"1. Log in at <a href='https://betbetter.com'>BetBetter.com</a>\n"
                f"2. Generate a code: POST /api/users/telegram/auth-code/generate/\n"
                f"3. Send me the command: /login CODE\n\n"
                f"Available commands:\n"
                f"/login CODE - Log in\n"
                f"/help - Help\n"
            )

        await update.message.reply_text(welcome_message, parse_mode='HTML')
        logger.info(f"User {user.first_name} ({telegram_id}) started the bot")
    except Exception as e:
        logger.error(f"Error in /start: {e}")
        await update.message.reply_text("Oops! Something went wrong. Try again later.")


async def login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    telegram_id = update.effective_user.id
    telegram_username = update.effective_user.username or "no_username"

    if not context.args:
        await update.message.reply_text("❌ Usage: /login CODE\n\nExample: /login ABC123DEF456")
        return

    code = context.args[0].upper()

    try:
        telegram_user = await sync_to_async(TelegramService.login_via_code)(
            telegram_id=telegram_id,
            telegram_username=telegram_username,
            code=code
        )

        await update.message.reply_text(
            f"✅ Login successful!\n\n"
            f"You are now logged in as: {telegram_user.user.username}\n\n"
            f"Available commands:\n"
            f"/balance - Check your balance\n"
            f"/help - Help\n"
        )
        logger.info(f"User {telegram_user.user.username} (Telegram: {telegram_id}) logged in successfully")

    except ValueError as e:
        if "expired" in str(e).lower():
            await update.message.reply_text("❌ Code expired or already used!")
        elif "already connected" in str(e).lower():
            await update.message.reply_text("⚠️ Your Telegram is already linked to another account!")
        else:
            await update.message.reply_text("❌ Invalid code!")
        logger.warning(f"Login attempt failed for Telegram {telegram_id}: {e}")
    except Exception as e:
        logger.error(f"Error in /login: {e}")
        await update.message.reply_text("Oops! Something went wrong. Try again later.")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    help_text = (
        "BetBetter - Help\n\n"
        "Available commands:\n"
        "/start - Show welcome message\n"
        "/login CODE - Log in to BetBetter\n"
        "/balance - Check your balance\n"
        "/refresh - Refresh stored Telegram username\n"
        "/help - Show this message\n"
    )
    await update.message.reply_text(help_text)


async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    telegram_id = update.effective_user.id

    try:
        telegram_profile = await sync_to_async(TelegramUser.objects.get)(telegram_id=telegram_id)
        user = telegram_profile.user

        total_balance = await sync_to_async(get_total_balance)(user)

        balance_message = (
            f"💰 Your total balance:\n\n"
            f"{total_balance} PLN\n\n"
        )

        accounts_qs = BookmakerAccountModel.objects.filter(user=user).select_related('bookmaker')
        accounts = await sync_to_async(list)(accounts_qs)
        if accounts:
            balance_message += "Account details:\n"
            for account in accounts:
                bookmaker_name = account.bookmaker.name if account.bookmaker else "Unknown"
                balance_message += f"• {bookmaker_name}: {account.balance} PLN\n"

        await update.message.reply_text(balance_message)
    except TelegramUser.DoesNotExist:
        await update.message.reply_text("❌ First send /login to log in!")
    except Exception as e:
        logger.error(f"Error in /balance: {e}")
        await update.message.reply_text("Oops! Something went wrong. Try again later.")


async def refresh(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    telegram_id = update.effective_user.id
    current_username = update.effective_user.username or ""
    try:
        telegram_profile = await sync_to_async(TelegramUser.objects.get)(telegram_id=telegram_id)
        old_username = telegram_profile.telegram_username or ""
        if not current_username:
            await update.message.reply_text("❌ Your Telegram account has no username set. Set a username in Telegram settings first.")
            return
        if current_username == old_username:
            await update.message.reply_text(f"ℹ️ Username unchanged: {current_username}")
            return
        telegram_profile.telegram_username = current_username
        await sync_to_async(telegram_profile.save)(update_fields=['telegram_username'])
        await update.message.reply_text(f"✅ Username updated: {old_username or '∅'} ➜ {current_username}")
    except TelegramUser.DoesNotExist:
        await update.message.reply_text("❌ Not linked. Use /login CODE first.")
    except Exception as e:
        logger.error(f"Error in /refresh: {e}")
        await update.message.reply_text("⚠️ Failed to refresh username. Try later.")


def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set in environment variables!")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("login", login))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("balance", balance))
    application.add_handler(CommandHandler("refresh", refresh))

    logger.info("Bot started...")
    application.run_polling()


if __name__ == '__main__':
    main()
