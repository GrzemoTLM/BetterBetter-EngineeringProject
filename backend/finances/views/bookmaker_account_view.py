from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from finances.serializers.bookmaker_account_serializer import BookmakerAccountSerializer
from finances.services.bookmaker_account_service import (
    create_bookmaker_account,
    update_bookmaker_account,
    get_bookmaker_account,
    list_bookmaker_accounts,
    delete_bookmaker_account,
    get_total_balance,
)


def handle_get_bookmaker_account(request, pk):
    try:
        account = get_bookmaker_account(pk)
        if account.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookmakerAccountSerializer(account, context={"request": request})
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def handle_update_bookmaker_account(request, pk):
    try:
        account = get_bookmaker_account(pk)
        if account.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        updated_account = update_bookmaker_account(account, request.data)
        serializer = BookmakerAccountSerializer(updated_account, context={"request": request})
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def handle_delete_bookmaker_account(request, pk):
    try:
        account = get_bookmaker_account(pk)
        if account.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        delete_bookmaker_account(account)
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            accounts = list_bookmaker_accounts(request.user)
            serializer = BookmakerAccountSerializer(accounts, many=True, context={"request": request})
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            account = create_bookmaker_account(request.data, request=request)
            serializer = BookmakerAccountSerializer(account, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        return handle_get_bookmaker_account(request, pk)

    def put(self, request, pk):
        return handle_update_bookmaker_account(request, pk)

    def patch(self, request, pk):
        return handle_update_bookmaker_account(request, pk)

    def delete(self, request, pk):
        return handle_delete_bookmaker_account(request, pk)

class TotalBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            total_balance = get_total_balance(request.user)
            return Response({
                "total_balance": float(total_balance)
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
