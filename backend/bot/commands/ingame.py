import logging
from telegram import Update
from telegram.ext import ContextTypes
from asgiref.sync import sync_to_async

from users.models import TelegramUser
from coupons.models.coupon import Coupon
from bot.helpers.language import detect_lang, get_msg, TELEGRAM_LANG_CACHE

logger = logging.getLogger(__name__)


async def ingame(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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
        coupons = await sync_to_async(
            lambda: list(Coupon.objects.filter(
                user_id=user_id, 
                status=Coupon.CouponStatus.IN_PROGRESS
            ).prefetch_related('bets').order_by('-created_at'))
        )()

        if not coupons:
            msg = "📊 Brak aktywnych kuponów." if lang == 'pl' else "📊 No active coupons."
            await update.message.reply_text(msg)
            return

        for coupon in coupons:
            bets = await sync_to_async(lambda c=coupon: list(c.bets.all()))()
            
            kurs = f"{coupon.multiplier:.2f}"
            stawka = f"{coupon.bet_stake:.2f} PLN"
            potencjalna_wygrana = f"{coupon.potential_payout:.2f} PLN"
            
            if lang == 'pl':
                msg = f"🎲 <b>Kupon #{coupon.id}</b>\n"
                msg += f"📈 Kurs: {kurs}\n"
                msg += f"💰 Stawka: {stawka}\n"
                msg += f"🏆 Potencjalna wygrana: {potencjalna_wygrana}\n\n"
                msg += f"<b>Typy:</b>\n"
            else:
                msg = f"🎲 <b>Coupon #{coupon.id}</b>\n"
                msg += f"📈 Odds: {kurs}\n"
                msg += f"💰 Stake: {stawka}\n"
                msg += f"🏆 Potential payout: {potencjalna_wygrana}\n\n"
                msg += f"<b>Bets:</b>\n"
            
            for bet in bets:
                bet_type_name = bet.bet_type.name if bet.bet_type else "N/A"
                msg += f"  • {bet.event_name}\n"
                msg += f"    {bet_type_name}: {bet.line} @ {bet.odds}\n"
            
            await update.message.reply_text(msg, parse_mode='HTML')
            
    except Exception as e:
        logger.error(f"Error in /ingame: {e}", exc_info=True)
        await update.message.reply_text(get_msg('error_generic', lang))

