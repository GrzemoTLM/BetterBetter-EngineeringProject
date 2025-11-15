import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
FANCY_BALANCE = str(os.getenv('TELEGRAM_FANCY_BALANCE', '1')).lower() in {'1', 'true', 'yes', 'on'}

DEFAULT_LANG = 'pl'
SUPPORTED_LANGS = {'pl', 'en'}
BOX_WIDTH = 60

MESSAGES = {
    'pl': {
        'start_existing': "Cześć {first_name}! 👋\n\nJesteś już zalogowany.\n\nDostępne komendy:\n/balance - Saldo\n/budget - Budżet\n/help - Pomoc",
        'start_new': "Cześć {first_name}! 👋\n\nWitamy w BetBetter!\nAby się zalogować:\n1. Zaloguj się w aplikacji web.\n2. Wygeneruj kod: POST /api/users/telegram/auth-code/generate/\n3. Wyślij: /login KOD\n\nKomendy:\n/login KOD - Logowanie\n/help - Pomoc",
        'login_usage': "❌ Użycie: /login KOD\nPrzykład: /login ABC123DEF456",
        'login_success': "✅ Logowanie udane!\nZalogowano jako: {username}\n\nKomendy:\n/balance - Saldo\n/budget - Budżet\n/help - Pomoc",
        'login_expired': "❌ Kod wygasł lub został użyty!",
        'login_already_connected': "⚠️ Ten Telegram jest już powiązany z innym kontem!",
        'login_invalid': "❌ Nieprawidłowy kod!",
        'help': "BetBetter - Pomoc\n\nKomendy:\n/start - Powitanie\n/login KOD - Logowanie\n/balance - Saldo i statystyki\n/budget - Budżet miesięczny\n/refresh - Odśwież nazwę użytkownika Telegram\n/help - Ten ekran",
        'balance_no_accounts': "Nie masz jeszcze żadnych kont bukmacherskich. Dodaj konto w aplikacji web.",
        'balance_total_header': "💰 SALDO CAŁKOWITE: {total} PLN",
        'balance_box_sub': "P/L NETTO od początku (tylko rozliczone kupony)",
        'balance_plain_header': "💰 Saldo łączne: {total} PLN\n\nKonta (netto P/L od początku):\n",
        'budget_no_limit': "❌ Nie masz ustawionego budżetu miesięcznego. Ustaw go w ustawieniach aplikacji web.",
        'budget_header': "💰 Budżet miesięczny",
        'budget_info': "Limit: {limit} PLN\nWpłacono w tym miesiącu: {spent} PLN\nZostało: {remaining} PLN",
        'budget_exceeded_title': "⚠️ BUDŻET PRZEKROCZONY!",
        'budget_exceeded_msg': "Twoje wpłaty w tym miesiącu ({spent} PLN) przekroczyły budżet ({limit} PLN) o {excess} PLN!",
        'refresh_no_username': "❌ Twój Telegram nie ma ustawionej nazwy użytkownika.",
        'refresh_unchanged': "ℹ️ Nazwa niezmieniona: {username}",
        'refresh_updated': "✅ Zaktualizowano nazwę: {old} ➜ {new}",
        'login_first': "❌ Najpierw użyj /login aby się zalogować!",
        'error_generic': "Oops! Coś poszło nie tak. Spróbuj później.",
        'alert_title': "OSTRZEŻENIE",
    },
    'en': {
        'start_existing': "Hello {first_name}! 👋\n\nYou are already logged in.\n\nAvailable commands:\n/balance - Balance\n/budget - Budget\n/help - Help",
        'start_new': "Hello {first_name}! 👋\n\nWelcome to BetBetter!\nTo log in:\n1. Sign in on the web app.\n2. Generate code: POST /api/users/telegram/auth-code/generate/\n3. Send: /login CODE\n\nCommands:\n/login CODE - Log in\n/help - Help",
        'login_usage': "❌ Usage: /login CODE\nExample: /login ABC123DEF456",
        'login_success': "✅ Login successful!\nLogged in as: {username}\n\nCommands:\n/balance - Balance\n/budget - Budget\n/help - Help",
        'login_expired': "❌ Code expired or already used!",
        'login_already_connected': "⚠️ This Telegram is already linked to another account!",
        'login_invalid': "❌ Invalid code!",
        'help': "BetBetter - Help\n\nCommands:\n/start - Welcome message\n/login CODE - Log in\n/balance - Balance & stats\n/budget - Monthly budget\n/refresh - Refresh Telegram username\n/help - This screen",
        'balance_no_accounts': "You have no bookmaker accounts yet. Add one in the web app.",
        'balance_total_header': "💰 TOTAL BALANCE: {total} PLN",
        'balance_box_sub': "NET P/L since start (settled coupons only)",
        'balance_plain_header': "💰 Total balance: {total} PLN\n\nAccounts (net P/L since start):\n",
        'budget_no_limit': "❌ You have no monthly budget limit set. Set it in the web app settings.",
        'budget_header': "💰 Monthly budget",
        'budget_info': "Limit: {limit} PLN\nSpent this month: {spent} PLN\nRemaining: {remaining} PLN",
        'budget_exceeded_title': "⚠️ BUDGET EXCEEDED!",
        'budget_exceeded_msg': "Your deposits this month ({spent} PLN) exceeded your budget ({limit} PLN) by {excess} PLN!",
        'refresh_no_username': "❌ Your Telegram has no username set.",
        'refresh_unchanged': "ℹ️ Username unchanged: {username}",
        'refresh_updated': "✅ Username updated: {old} ➜ {new}",
        'login_first': "❌ Use /login first to link your account!",
        'error_generic': "Oops! Something went wrong. Try again later.",
        'alert_title': "WARNING",
    }
}
