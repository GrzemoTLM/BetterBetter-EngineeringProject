from finances.models.transactions import Transaction
from finances.serializers.transaction_serializer import TransactionCreateSerializer, TransactionUpdateSerializer


def create_transaction(data):
    serializer = TransactionCreateSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    transaction = serializer.save()
    return transaction


def update_transaction(transaction_id, data):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        raise ValueError("Transaction not found.")
    
    serializer = TransactionUpdateSerializer(transaction, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    transaction = serializer.save()
    return transaction


def get_transaction(transaction_id):
    try:
        return Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        raise ValueError("Transaction not found.")


def list_transactions(user):
    return Transaction.objects.filter(user=user).order_by('-created_at')


def delete_transaction(transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
        transaction.delete()
    except Transaction.DoesNotExist:
        raise ValueError("Transaction not found.")
