from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from finances.serializers.bookmaker_account_serializer import BookmakerAccountSerializer
from finances.services.transaction_service import create_transaction, update_transaction, get_transaction, list_transactions, delete_transaction


def handle_get_bookmaker_account(request, pk):
    try:
        account = get_transaction(pk)
        if account.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        serializer = BookmakerAccountSerializer(account)
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def handle_update_bookmaker_account(request, pk):
    try:
        account = get_transaction(pk)
        if account.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        updated_account = update_transaction(pk, request.data)
        serializer = BookmakerAccountSerializer(updated_account)
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def handle_delete_bookmaker_account(request, pk):
    try:
        account = get_transaction(pk)
        if account.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        delete_transaction(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountListView(APIView):
    def get(self, request):
        try:
            accounts = list_transactions(request.user)
            serializer = BookmakerAccountSerializer(accounts, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountCreateView(APIView):
    def post(self, request):
        try:
            data = request.data.copy()
            data['user'] = request.user.id
            account = create_transaction(data)
            serializer = BookmakerAccountSerializer(account)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountDetailView(APIView):
    def get(self, request, pk):
        return handle_get_bookmaker_account(request, pk)

    def put(self, request, pk):
        return handle_update_bookmaker_account(request, pk)

    def patch(self, request, pk):
        return handle_update_bookmaker_account(request, pk)

    def delete(self, request, pk):
        return handle_delete_bookmaker_account(request, pk)