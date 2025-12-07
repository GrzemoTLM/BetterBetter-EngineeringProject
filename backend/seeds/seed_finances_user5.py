from datetime import datetime, timedelta
import calendar
import random

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction as db_tx
from django.db.models import F

from finances.models.transactions import Transaction, TransactionType
from finances.models.bookmaker_account import BookmakerAccountModel


def seed_user5_transactions(year: int = 2025, start_month: int = 1, end_month: int = 11, per_month: int = 15):
    """Utwórz testowe transakcje dla usera id=5 w zakresie miesięcy.

    - rok domyślnie 2025
    - miesiące od 1 do 11 (włącznie)
    - per_month transakcji na miesiąc
    """
    User = get_user_model()
    user = User.objects.get(id=5)

    accounts = list(BookmakerAccountModel.objects.filter(user=user))
    if not accounts:
        raise RuntimeError("Brak kont bukmacherskich dla usera 5")

    def month_range(y: int, m: int):
        start = datetime(y, m, 1, 12, 0)
        last_day = calendar.monthrange(y, m)[1]
        end = datetime(y, m, last_day, 20, 59)
        return start, end

    # Ustalony seed, żeby wynik był powtarzalny
    random.seed(42)

    created = 0

    for month in range(start_month, end_month + 1):
        start, end = month_range(year, month)
        total_seconds = int((end - start).total_seconds())

        for _ in range(per_month):
            offset = random.randint(0, total_seconds)
            dt_naive = start + timedelta(seconds=offset)
            dt = timezone.make_aware(dt_naive, timezone.get_current_timezone())

            account = random.choice(accounts)
            t_type = (
                TransactionType.DEPOSIT
                if random.random() < 0.6
                else TransactionType.WITHDRAWAL
            )
            amount = random.choice([20, 50, 75, 100, 150, 200, 250, 300, 400, 500])

            with db_tx.atomic():
                tx = Transaction.objects.create(
                    user=user,
                    bookmaker_account=account,
                    amount=amount,
                    transaction_type=t_type,
                    created_at=dt,
                    updated_at=dt,
                )

                # Aktualizacja salda konta jak w create_transaction
                acc = BookmakerAccountModel.objects.select_for_update().get(pk=account.pk)
                if tx.transaction_type == TransactionType.DEPOSIT:
                    acc.balance = F("balance") + tx.amount
                else:
                    acc.balance = F("balance") - tx.amount
                acc.save(update_fields=["balance"])

            created += 1

    return created


if __name__ == "__main__":
    created = seed_user5_transactions()
    print(f"Utworzono {created} transakcji dla usera 5")

