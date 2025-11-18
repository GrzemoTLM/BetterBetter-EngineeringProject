from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
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
    @swagger_auto_schema(
        operation_summary='List user transactions',
        operation_description='Get all transactions for authenticated user',
        responses={
            200: openapi.Response('List of transactions', TransactionSerializer(many=True)),
            400: openapi.Response('Error retrieving transactions'),
        }
    )
    def get(self, request):
        try:
            transactions = list_transactions(request.user)
            serializer = TransactionSerializer(transactions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TransactionCreateView(APIView):
    @swagger_auto_schema(
        operation_summary='Create transaction',
        operation_description='Create a new financial transaction',
        request_body=TransactionSerializer,
        responses={
            201: openapi.Response('Transaction created', TransactionSerializer),
            400: openapi.Response('Invalid data'),
        }
    )
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
    @swagger_auto_schema(
        operation_summary='Get transaction',
        operation_description='Retrieve a specific transaction',
        responses={
            200: openapi.Response('Transaction details', TransactionSerializer),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Transaction not found'),
        }
    )
    def get(self, request, pk):
        return handle_get_transaction(request, pk)

    @swagger_auto_schema(
        operation_summary='Update transaction',
        operation_description='Update a transaction (PUT)',
        request_body=TransactionSerializer,
        responses={
            200: openapi.Response('Transaction updated', TransactionSerializer),
            400: openapi.Response('Invalid data'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Transaction not found'),
        }
    )
    def put(self, request, pk):
        return handle_update_transaction(request, pk)

    @swagger_auto_schema(
        operation_summary='Partial update transaction',
        operation_description='Update a transaction (PATCH)',
        request_body=TransactionSerializer,
        responses={
            200: openapi.Response('Transaction updated', TransactionSerializer),
            400: openapi.Response('Invalid data'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Transaction not found'),
        }
    )
    def patch(self, request, pk):
        return handle_update_transaction(request, pk)

    @swagger_auto_schema(
        operation_summary='Delete transaction',
        operation_description='Delete a transaction',
        responses={
            204: openapi.Response('Transaction deleted'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Transaction not found'),
        }
    )
    def delete(self, request, pk):
        return handle_delete_transaction(request, pk)


class TransactionSummaryView(APIView):
    @swagger_auto_schema(
        operation_summary='Get transaction summary',
        operation_description='Get summary of deposits, withdrawals and net deposits',
        responses={
            200: openapi.Response('Transaction summary'),
            400: openapi.Response('Error calculating summary'),
        }
    )
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
