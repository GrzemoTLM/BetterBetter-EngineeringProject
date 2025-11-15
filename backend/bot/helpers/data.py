from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils.timezone import now

from users.models import TelegramUser, UserSettings
from finances.models import BookmakerAccountModel, Transaction
from coupons.models.coupon import Coupon


def collect_balance_data_full(telegram_id: int):
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


def get_monthly_budget_info(user_id: int):
    try:
        user_settings = UserSettings.objects.get(user_id=user_id)
    except UserSettings.DoesNotExist:
        return None, None, None

    monthly_limit = user_settings.monthly_budget_limit
    if not monthly_limit or monthly_limit <= 0:
        return None, None, None

    current_date = now()
    month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    deposits_agg = Transaction.objects.filter(
        user_id=user_id,
        transaction_type='DEPOSIT',
        created_at__gte=month_start
    ).aggregate(total=Sum('amount'))

    total_spent = deposits_agg.get('total') or Decimal('0.00')
    remaining = monthly_limit - total_spent

    return monthly_limit, total_spent, remaining
