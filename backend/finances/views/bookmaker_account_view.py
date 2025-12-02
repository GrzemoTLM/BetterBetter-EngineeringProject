from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from finances.serializers.bookmaker_account_serializer import BookmakerAccountSerializer
from finances.services.bookmaker_account_service import (
    create_bookmaker_account,
    update_bookmaker_account,
    get_bookmaker_account,
    list_bookmaker_accounts,
    delete_bookmaker_account,
    get_total_balance,
)
from finances.models.bookmaker_account import BookmakerAccountModel
from django.db.models import Sum, Q
from finances.models.transactions import Transaction, TransactionType
from decimal import Decimal


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

    @swagger_auto_schema(
        operation_summary='List bookmaker accounts',
        operation_description='Get all bookmaker accounts for authenticated user',
        responses={
            200: openapi.Response('List of bookmaker accounts', BookmakerAccountSerializer(many=True)),
            400: openapi.Response('Error retrieving accounts'),
        }
    )
    def get(self, request):
        try:
            accounts = list_bookmaker_accounts(request.user)
            serializer = BookmakerAccountSerializer(accounts, many=True, context={"request": request})
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Create bookmaker account',
        operation_description='Create a new bookmaker account',
        request_body=BookmakerAccountSerializer,
        responses={
            201: openapi.Response('Account created', BookmakerAccountSerializer),
            400: openapi.Response('Invalid data'),
        }
    )
    def post(self, request):
        try:
            account = create_bookmaker_account(request.data, request=request)
            serializer = BookmakerAccountSerializer(account, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get bookmaker account',
        operation_description='Retrieve a specific bookmaker account',
        responses={
            200: openapi.Response('Account details', BookmakerAccountSerializer),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Account not found'),
        }
    )
    def get(self, request, pk):
        return handle_get_bookmaker_account(request, pk)

    @swagger_auto_schema(
        operation_summary='Update bookmaker account',
        operation_description='Update a bookmaker account (PUT)',
        request_body=BookmakerAccountSerializer,
        responses={
            200: openapi.Response('Account updated', BookmakerAccountSerializer),
            400: openapi.Response('Invalid data'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Account not found'),
        }
    )
    def put(self, request, pk):
        return handle_update_bookmaker_account(request, pk)

    @swagger_auto_schema(
        operation_summary='Partial update bookmaker account',
        operation_description='Update a bookmaker account (PATCH)',
        request_body=BookmakerAccountSerializer,
        responses={
            200: openapi.Response('Account updated', BookmakerAccountSerializer),
            400: openapi.Response('Invalid data'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Account not found'),
        }
    )
    def patch(self, request, pk):
        return handle_update_bookmaker_account(request, pk)

    @swagger_auto_schema(
        operation_summary='Delete bookmaker account',
        operation_description='Delete a bookmaker account',
        responses={
            204: openapi.Response('Account deleted'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Account not found'),
        }
    )
    def delete(self, request, pk):
        return handle_delete_bookmaker_account(request, pk)


class TotalBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get total balance',
        operation_description='Get total balance across all bookmaker accounts',
        responses={
            200: openapi.Response('Total balance'),
            400: openapi.Response('Error calculating balance'),
        }
    )
    def get(self, request):
        try:
            total_balance = get_total_balance(request.user)
            return Response({"total_balance": float(total_balance)})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get bookmaker account coupon summary',
        operation_description='Get coupon balance statistics for a specific bookmaker account. coupon_balance = suma profitów (wygrana - stawka dla wygranych, -stawka dla przegranych)',
        responses={
            200: openapi.Response('Account coupon summary'),
            403: openapi.Response('Not authorized'),
            404: openapi.Response('Account not found'),
        }
    )
    def get(self, request, pk):
        try:
            account = get_bookmaker_account(pk)
            if account.user != request.user:
                return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

            # Balans kuponów = suma balance (profit po odjęciu stawek)
            from coupons.models import Coupon

            won_agg = Coupon.objects.filter(
                user=request.user,
                bookmaker_account=account,
                status=Coupon.CouponStatus.WON
            ).aggregate(
                profit=Sum('balance'),
                count=Sum(1)
            )

            lost_agg = Coupon.objects.filter(
                user=request.user,
                bookmaker_account=account,
                status=Coupon.CouponStatus.LOST
            ).aggregate(
                profit=Sum('balance'),
                count=Sum(1)
            )

            won_profit = won_agg['profit'] or Decimal('0.00')
            won_count = won_agg['count'] or 0
            lost_profit = lost_agg['profit'] or Decimal('0.00')
            lost_count = lost_agg['count'] or 0
            total_profit = won_profit + lost_profit

            return Response({
                'bookmaker_account': account.id,
                'bookmaker': account.bookmaker.name,
                'currency': account.currency.code,
                'coupon_balance': float(total_profit),  # Suma profitów (po odjęciu stawek)
                'won_profit': float(won_profit),  # Suma profitów z wygranych
                'won_count': won_count,
                'lost_profit': float(lost_profit),  # Suma strat z przegranych
                'lost_count': lost_count,
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BookmakerAccountsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary='Get all bookmaker accounts coupon summary',
        operation_description='Get coupon balance statistics for all bookmaker accounts. coupon_balance = suma profitów (wygrana - stawka dla wygranych, -stawka dla przegranych)',
        responses={
            200: openapi.Response('Accounts coupon summary'),
            400: openapi.Response('Error calculating summary'),
        }
    )
    def get(self, request):
        try:
            from coupons.models import Coupon

            qs = (
                BookmakerAccountModel.objects
                .filter(user=request.user)
                .select_related('bookmaker', 'currency')
            )
            results = []
            for acc in qs:
                # Balans kuponów = suma balance (profit po odjęciu stawek)
                won_agg = Coupon.objects.filter(
                    user=request.user,
                    bookmaker_account=acc,
                    status=Coupon.CouponStatus.WON
                ).aggregate(
                    profit=Sum('balance'),
                    count=Sum(1)
                )

                lost_agg = Coupon.objects.filter(
                    user=request.user,
                    bookmaker_account=acc,
                    status=Coupon.CouponStatus.LOST
                ).aggregate(
                    profit=Sum('balance'),
                    count=Sum(1)
                )

                won_profit = won_agg['profit'] or Decimal('0.00')
                won_count = won_agg['count'] or 0
                lost_profit = lost_agg['profit'] or Decimal('0.00')
                lost_count = lost_agg['count'] or 0
                total_profit = won_profit + lost_profit

                results.append({
                    'id': acc.id,
                    'bookmaker': acc.bookmaker.name,
                    'alias': acc.alias,
                    'currency': acc.currency.code,
                    'coupon_balance': float(total_profit),  # Suma profitów (po odjęciu stawek)
                    'won_profit': float(won_profit),  # Suma profitów z wygranych
                    'won_count': won_count,
                    'lost_profit': float(lost_profit),  # Suma strat z przegranych
                    'lost_count': lost_count,
                })
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
