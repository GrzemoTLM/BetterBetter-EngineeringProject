from bot.config import MESSAGES, SUPPORTED_LANGS, DEFAULT_LANG

TELEGRAM_LANG_CACHE: dict[int, str] = {}


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

