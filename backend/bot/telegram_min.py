import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    welcome_message = (
        f"Cześć {user.first_name}! 👋\n\n"
        f"Witaj w BetBetter - Twojego asystenta bukmacherskiego!\n\n"
        f"Dostępne komendy:\n"
        f"/start - Wyświetl tę wiadomość\n"
        f"/help - Pomoc\n"
    )
    await update.message.reply_text(welcome_message)
    logger.info(f"User {user.first_name} ({user.id}) started the bot")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    help_text = (
        "BetBetter - Pomoc\n\n"
        "Dostępne komendy:\n"
        "/start - Wyświetl powitanie\n"
        "/help - Wyświetl tę wiadomość\n"
        "/balance - Sprawdź swój balans\n"
    )
    await update.message.reply_text(help_text)


async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Funkcja balansu będzie niedługo dostępna 💰")


def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN nie jest ustawiony w zmiennych środowiskowych!")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("balance", balance))

    logger.info("Bot został uruchomiony...")
    application.run_polling()


if __name__ == '__main__':
    main()

