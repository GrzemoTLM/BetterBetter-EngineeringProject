import os
import logging
import django
from decimal import Decimal
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model

load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BetBetter.settings_bot')
django.setup()

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

from users.models import TelegramUser
from users.services.telegram_service import TelegramService
from finances.models import BookmakerAccountModel
from coupon_analytics.models import AlertEvent
from coupons.models.coupon import Coupon

User = get_user_model()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
FANCY_BALANCE = str(os.getenv('TELEGRAM_FANCY_BALANCE', '1')).lower() in {'1', 'true', 'yes', 'on'}
TELEGRAM_LANG_CACHE: dict[int, str] = {}
DEFAULT_LANG = 'pl'
SUPPORTED_LANGS = {'pl', 'en'}
BOX_WIDTH = 60
MESSAGES = {
    'pl': {
        'start_existing': "Cześć {first_name}! 👋\n\nJesteś już zalogowany.\n\nDostępne komendy:\n/balance - Saldo\n/help - Pomoc",
        'start_new': "Cześć {first_name}! 👋\n\nWitamy w BetBetter!\nAby się zalogować:\n1. Zaloguj się w aplikacji web.\n2. Wygeneruj kod: POST /api/users/telegram/auth-code/generate/\n3. Wyślij: /login KOD\n\nKomendy:\n/login KOD - Logowanie\n/help - Pomoc",
        'login_usage': "❌ Użycie: /login KOD\nPrzykład: /login ABC123DEF456",
        'login_success': "✅ Logowanie udane!\nZalogowano jako: {username}\n\nKomendy:\n/balance - Saldo\n/help - Pomoc",
        'login_expired': "❌ Kod wygasł lub został użyty!",
        'login_already_connected': "⚠️ Ten Telegram jest już powiązany z innym kontem!",
        'login_invalid': "❌ Nieprawidłowy kod!",
        'help': "BetBetter - Pomoc\n\nKomendy:\n/start - Powitanie\n/login KOD - Logowanie\n/balance - Saldo i statystyki\n/refresh - Odśwież nazwę użytkownika Telegram\n/fancy_on - Włącz ramki alertów\n/fancy_off - Wyłącz ramki alertów\n/help - Ten ekran",
        'balance_no_accounts': "Nie masz jeszcze żadnych kont bukmacherskich. Dodaj konto w aplikacji web.",
        'balance_total_header': "💰 SALDO CAŁKOWITE: {total} PLN",
        'balance_box_sub': "P/L NETTO od początku (tylko rozliczone kupony)",
        'balance_plain_header': "💰 Saldo łączne: {total} PLN\n\nKonta (netto P/L od początku):\n",
        'refresh_no_username': "❌ Twój Telegram nie ma ustawionej nazwy użytkownika.",
        'refresh_unchanged': "ℹ️ Nazwa niezmieniona: {username}",
        'refresh_updated': "✅ Zaktualizowano nazwę: {old} ➜ {new}",
        'login_first': "❌ Najpierw użyj /login aby się zalogować!",
        'error_generic': "Oops! Coś poszło nie tak. Spróbuj później.",
        'alert_title': "OSTRZEŻENIE",
    },
    'en': {
        'start_existing': "Hello {first_name}! 👋\n\nYou are already logged in.\n\nAvailable commands:\n/balance - Balance\n/help - Help",
        'start_new': "Hello {first_name}! 👋\n\nWelcome to BetBetter!\nTo log in:\n1. Sign in on the web app.\n2. Generate code: POST /api/users/telegram/auth-code/generate/\n3. Send: /login CODE\n\nCommands:\n/login CODE - Log in\n/help - Help",
        'login_usage': "❌ Usage: /login CODE\nExample: /login ABC123DEF456",
        'login_success': "✅ Login successful!\nLogged in as: {username}\n\nCommands:\n/balance - Balance\n/help - Help",
        'login_expired': "❌ Code expired or already used!",
        'login_already_connected': "⚠️ This Telegram is already linked to another account!",
        'login_invalid': "❌ Invalid code!",
        'help': "BetBetter - Help\n\nCommands:\n/start - Welcome message\n/login CODE - Log in\n/balance - Balance & stats\n/refresh - Refresh Telegram username\n/fancy_on - Enable alert frames\n/fancy_off - Disable alert frames\n/help - This screen",
        'balance_no_accounts': "You have no bookmaker accounts yet. Add one in the web app.",
        'balance_total_header': "💰 TOTAL BALANCE: {total} PLN",
        'balance_box_sub': "NET P/L since start (settled coupons only)",
        'balance_plain_header': "💰 Total balance: {total} PLN\n\nAccounts (net P/L since start):\n",
        'refresh_no_username': "❌ Your Telegram has no username set.",
        'refresh_unchanged': "ℹ️ Username unchanged: {username}",
        'refresh_updated': "✅ Username updated: {old} ➜ {new}",
        'login_first': "❌ Use /login first to link your account!",
        'error_generic': "Oops! Something went wrong. Try again later.",
        'alert_title': "WARNING",
    }
}

def detect_lang(update) -> str:
    code = (getattr(update.effective_user, 'language_code', '') or '').lower()
    if code.startswith('pl'):
        return 'pl'
    if code.startswith('en'):
        return 'en'
    return DEFAULT_LANG


def get_msg(key: str, lang: str, **kwargs) -> str:
    lang = lang if lang in SUPPORTED_LANGS else DEFAULT_LANG
    template = MESSAGES[lang].get(key, key)
    try:
        return template.format(**kwargs)
    except Exception:
        return template

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


def _collect_balance_data_full(telegram_id: int):
    try:
        telegram_profile = TelegramUser.objects.get(telegram_id=telegram_id)
        user_id = telegram_profile.user_id
    except TelegramUser.DoesNotExist:
        return None, None, None

    balance_agg = BookmakerAccountModel.objects.filter(user_id=user_id).aggregate(
        total=Sum('balance')
    )
    total_balance = balance_agg.get('total') or Decimal('0.00')

    accounts = list(
        BookmakerAccountModel.objects.filter(user_id=user_id)
        .select_related('bookmaker', 'currency')
    )

    stats: list[dict] = []
    for account in accounts:
        agg = Coupon.objects.filter(
            user_id=user_id,
            bookmaker_account=account,
            status__in=[Coupon.CouponStatus.WON, Coupon.CouponStatus.LOST]
        ).aggregate(
            net_pl=Sum('balance'),
            cnt=Count('id'),
            won_cnt=Count('id', filter=Q(status=Coupon.CouponStatus.WON)),
            lost_cnt=Count('id', filter=Q(status=Coupon.CouponStatus.LOST)),
        )
        net_pl = agg.get('net_pl') or Decimal('0.00')

        try:
            bookmaker_name = account.bookmaker.name if account.bookmaker else 'Unknown'
            currency_code = account.currency.code if account.currency else 'PLN'
        except Exception:
            bookmaker_name = 'Unknown'
            currency_code = 'PLN'

        stats.append({
            'bookmaker': bookmaker_name,
            'currency': currency_code,
            'current_balance': str(account.balance),
            'net_pl': str(net_pl),
            'won_cnt': agg.get('won_cnt') or 0,
            'lost_cnt': agg.get('lost_cnt') or 0,
        })

    stats.sort(key=lambda x: (-(float(x['net_pl'] or 0)), x['bookmaker']))
    return telegram_profile, total_balance, stats


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


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    await update.message.reply_text(get_msg('help', lang))


async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lang = detect_lang(update)
    TELEGRAM_LANG_CACHE[update.effective_user.id] = lang
    telegram_id = update.effective_user.id
    try:

        telegram_profile, total_balance, stats = await sync_to_async(_collect_balance_data_full, thread_sensitive=True)(telegram_id)

        if telegram_profile is None:
            await update.message.reply_text(get_msg('login_first', lang))
            return

        if not stats:
            await update.message.reply_text(get_msg('balance_no_accounts', lang))
            return

        if FANCY_BALANCE:
            header = [
                get_msg('balance_total_header', lang, total=total_balance),
                get_msg('balance_box_sub', lang),
            ]
            lines = [
                f"{s['bookmaker']} [{s['currency']}] | saldo: {s['current_balance']} | P/L: {s['net_pl']} | W/L: {s['won_cnt']}/{s['lost_cnt']}" if lang == 'pl' else
                f"{s['bookmaker']} [{s['currency']}] | balance: {s['current_balance']} | P/L: {s['net_pl']} | W/L: {s['won_cnt']}/{s['lost_cnt']}"
                for s in stats
            ]
            box_lines = header + [""] + lines
            box = _build_box(box_lines, title=('KONTA BUKMACHERSKIE' if lang == 'pl' else 'BOOKMAKER ACCOUNTS'))
            await update.message.reply_text(f"<pre>{box}</pre>", parse_mode='HTML')
        else:
            msg = get_msg('balance_plain_header', lang, total=total_balance)
            for s in stats:
                if lang == 'pl':
                    msg += f"• {s['bookmaker']} [{s['currency']}] — saldo: {s['current_balance']}, P/L: {s['net_pl']} (W/L: {s['won_cnt']}/{s['lost_cnt']})\n"
                else:
                    msg += f"• {s['bookmaker']} [{s['currency']}] — balance: {s['current_balance']}, P/L: {s['net_pl']} (W/L: {s['won_cnt']}/{s['lost_cnt']})\n"
            await update.message.reply_text(msg)
    except Exception as e:
        logger.error(f"Error in /balance: {e}", exc_info=True)
        await update.message.reply_text(get_msg('error_generic', lang))


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




async def send_pending_alert_events(context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        pending_events = await sync_to_async(lambda: list(AlertEvent.objects.filter(sent_at__isnull=True).select_related('user', 'rule')))()
        if not pending_events:
            return
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
    except Exception as e:
        logger.error(f"Error sending pending alert events: {e}")


def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set in environment variables!")
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("login", login))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("balance", balance))
    application.add_handler(CommandHandler("refresh", refresh))
    application.job_queue.run_repeating(send_pending_alert_events, interval=5, first=2)
    logger.info("Bot started with JobQueue alert events task...")
    application.run_polling()


if __name__ == '__main__':
    main()
