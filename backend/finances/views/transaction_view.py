from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from finances.serializers.transaction_serializer import TransactionSerializer
from finances.services.transaction_service import create_transaction, update_transaction, get_transaction, list_transactions, delete_transaction
from finances.services.transaction_service import user_transactions_summary
from decimal import Decimal


def handle_get_transaction(request, pk):
    try:
        transaction = get_transaction(pk)
        if transaction.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def handle_update_transaction(request, pk):
    try:
        transaction = get_transaction(pk)
        if transaction.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        updated_transaction = update_transaction(pk, request.data)
        serializer = TransactionSerializer(updated_transaction)
        return Response(serializer.data)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def handle_delete_transaction(request, pk):
    try:
        transaction = get_transaction(pk)
        if transaction.user != request.user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        delete_transaction(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TransactionListView(APIView):
    def get(self, request):
        try:
            transactions = list_transactions(request.user)
            serializer = TransactionSerializer(transactions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TransactionCreateView(APIView):
    def post(self, request):
        try:
            data = request.data.copy()
            data['user'] = request.user.id
            transaction = create_transaction(data)
            serializer = TransactionSerializer(transaction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TransactionDetailView(APIView):
    def get(self, request, pk):
        return handle_get_transaction(request, pk)

    def put(self, request, pk):
        return handle_update_transaction(request, pk)

    def patch(self, request, pk):
        return handle_update_transaction(request, pk)

    def delete(self, request, pk):
        return handle_delete_transaction(request, pk)


class TransactionSummaryView(APIView):
    def get(self, request):
        try:
            summary = user_transactions_summary(request.user)
            net = (summary['total_deposited'] or Decimal('0.00')) - (summary['total_withdrawn'] or Decimal('0.00'))
            return Response({
                'total_deposited': float(summary['total_deposited']),
                'total_withdrawn': float(summary['total_withdrawn']),
                'net_deposits': float(net),
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
