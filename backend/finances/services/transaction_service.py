from finances.models.transactions import Transaction, TransactionType
from finances.serializers.transaction_serializer import TransactionCreateSerializer, TransactionUpdateSerializer
from django.db.models import Sum, Q, F
from django.db import transaction as db_transaction
from decimal import Decimal


def create_transaction(data):
    serializer = TransactionCreateSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    with db_transaction.atomic():
        transaction = serializer.save()
        account = transaction.bookmaker_account
        if account:
            if transaction.transaction_type == TransactionType.DEPOSIT:
                account.balance = F('balance') + transaction.amount
            else:
                account.balance = F('balance') - transaction.amount
            account.save(update_fields=['balance'])
        return transaction


def update_transaction(transaction_id, data):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        raise ValueError("Transaction not found.")
    
    old_amount = transaction.amount
    serializer = TransactionUpdateSerializer(transaction, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    with db_transaction.atomic():
        transaction = serializer.save()
        diff = transaction.amount - old_amount
        if diff != 0 and transaction.bookmaker_account:
            account = transaction.bookmaker_account
            if transaction.transaction_type == TransactionType.DEPOSIT:
                account.balance = F('balance') + diff
            else:
                account.balance = F('balance') - diff
            account.save(update_fields=['balance'])
    return transaction


def get_transaction(transaction_id):
    try:
        return Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        raise ValueError("Transaction not found.")


def list_transactions(user, *, date_from=None, date_to=None, bookmaker=None, bookmaker_id=None, transaction_type=None):
    qs = Transaction.objects.filter(user=user)
    if date_from:
        qs = qs.filter(created_at__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__lte=date_to)
    if bookmaker_id:
        qs = qs.filter(bookmaker_account__bookmaker_id=bookmaker_id)
    if bookmaker:
        qs = qs.filter(bookmaker_account__bookmaker__name__iexact=bookmaker)
    if transaction_type:
        qs = qs.filter(transaction_type=transaction_type)
    return qs.order_by('-created_at')


def delete_transaction(transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        raise ValueError("Transaction not found.")

    with db_transaction.atomic():
        account = transaction.bookmaker_account
        if account:
            if transaction.transaction_type == TransactionType.DEPOSIT:
                account.balance = F('balance') - transaction.amount
            else:
                account.balance = F('balance') + transaction.amount
            account.save(update_fields=['balance'])
        transaction.delete()


def user_transactions_summary(user):
    qs = Transaction.objects.filter(user=user)
    agg = qs.aggregate(
        deposited=Sum('amount', filter=Q(transaction_type=TransactionType.DEPOSIT)),
        withdrawn=Sum('amount', filter=Q(transaction_type=TransactionType.WITHDRAWAL)),
    )
    deposited = agg['deposited'] or Decimal('0.00')
    withdrawn = agg['withdrawn'] or Decimal('0.00')
    return {
        'total_deposited': deposited,
        'total_withdrawn': withdrawn,
    }
