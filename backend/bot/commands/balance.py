import logging
from telegram import Update
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async

from bot.helpers.language import detect_lang, get_msg, TELEGRAM_LANG_CACHE
from bot.helpers.data import collect_balance_data_full

logger = logging.getLogger(__name__)


async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    telegram_id = update.effective_user.id
    
    try:
        telegram_profile, total_balance, stats = await sync_to_async(
            collect_balance_data_full, 
            thread_sensitive=True
        )(telegram_id)

        if telegram_profile is None:
            await update.message.reply_text(get_msg('login_first', lang))
            return

        if not stats:
            await update.message.reply_text(get_msg('balance_no_accounts', lang))
            return

        total_balance_float = float(total_balance)
        total_emoji = "🟢" if total_balance_float >= 0 else "🔴"

        header = f"{total_emoji} {'Saldo łączne:' if lang == 'pl' else 'Total balance:'} {total_balance} PLN\n"
        header += f"{'P/L netto od początku (tylko rozliczone kupony)' if lang == 'pl' else 'Net P/L since start (settled coupons only)'}\n"
        header += "\n"

        msg = header
        for s in stats:
            net_pl_float = float(s['net_pl'])
            pl_emoji = "🟢" if net_pl_float >= 0 else "🔴"

            if lang == 'pl':
                msg += f"{pl_emoji} <b>{s['bookmaker']}</b> [{s['currency']}]\n"
                msg += f"   Saldo: {s['current_balance']} PLN\n"
                msg += f"   P/L: {s['net_pl']} PLN\n"
                msg += f"   W/L: {s['won_cnt']}/{s['lost_cnt']}\n\n"
            else:
                msg += f"{pl_emoji} <b>{s['bookmaker']}</b> [{s['currency']}]\n"
                msg += f"   Balance: {s['current_balance']} PLN\n"
                msg += f"   P/L: {s['net_pl']} PLN\n"
                msg += f"   W/L: {s['won_cnt']}/{s['lost_cnt']}\n\n"

        await update.message.reply_text(msg, parse_mode='HTML')
    except Exception as e:
        logger.error(f"Error in /balance: {e}", exc_info=True)
        await update.message.reply_text(get_msg('error_generic', lang))
