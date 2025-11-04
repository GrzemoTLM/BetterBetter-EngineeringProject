from decimal import Decimal
from finances.models.bookmaker_account import BookmakerAccountModel
from finances.serializers.bookmaker_account_serializer import BookmakerAccountSerializer


def get_bookmaker_account(bookmaker_account_id):
    try:
        return BookmakerAccountModel.objects.get(id=bookmaker_account_id)
    except BookmakerAccountModel.DoesNotExist:
        raise ValueError("Bookmaker account not found.")


def list_bookmaker_accounts(user):
    return BookmakerAccountModel.objects.filter(user=user).order_by('created_at')


def create_bookmaker_account(data, request=None):
    serializer = BookmakerAccountSerializer(data=data, context={"request": request} if request else None)
    serializer.is_valid(raise_exception=True)
    bookmaker_account = serializer.save()
    return bookmaker_account


def update_bookmaker_account(bookmaker_account, data, request=None):
    serializer = BookmakerAccountSerializer(bookmaker_account, data=data, partial=True, context={"request": request} if request else None)
    serializer.is_valid(raise_exception=True)
    bookmaker_account = serializer.save()
    return bookmaker_account


def delete_bookmaker_account(bookmaker_account):
    bookmaker_account.delete()