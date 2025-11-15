#!/usr/bin/env python3

import os
import logging
import django
from telegram.ext import Application, CommandHandler

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings_bot')
django.setup()

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

from bot.config import TELEGRAM_BOT_TOKEN
from bot.commands.auth import start, login
from bot.commands.balance import balance
from bot.commands.budget import budget
from bot.commands.utils import help_command, refresh
from bot.commands.ingame import ingame
from bot.notifications.alerts import send_pending_alert_events
from bot.notifications.budget_monitor import check_budget_exceeded


def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set in environment variables!")
    
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("login", login))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("balance", balance))
    application.add_handler(CommandHandler("budget", budget))
    application.add_handler(CommandHandler("refresh", refresh))
    application.add_handler(CommandHandler("ingame", ingame))

    application.job_queue.run_repeating(send_pending_alert_events, interval=5, first=2)
    application.job_queue.run_repeating(check_budget_exceeded, interval=30, first=5)
    
    logger.info("Bot started with JobQueue alert events and budget monitoring tasks...")
    
    application.run_polling()


if __name__ == '__main__':
    main()
