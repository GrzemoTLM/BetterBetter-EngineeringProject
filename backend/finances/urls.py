from django.urls import path
from finances.views.transaction_view import TransactionListView, TransactionCreateView, TransactionDetailView
from finances.views.bookmaker_account_view import (
    BookmakerAccountListView,
    BookmakerAccountCreateView,
    BookmakerAccountDetailView,
    TotalBalanceView,
)

urlpatterns = [
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('transactions/create/', TransactionCreateView.as_view(), name='transaction-create'),
    path('transactions/<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),

    path('bookmakers/accounts/', BookmakerAccountListView.as_view(), name='bookmaker-account-list'),
    path('bookmakers/accounts/create/', BookmakerAccountCreateView.as_view(), name='bookmaker-account-create'),
    path('bookmakers/accounts/<int:pk>/', BookmakerAccountDetailView.as_view(), name='bookmaker-account-detail'),
    path('bookmakers/accounts/total/balance/', TotalBalanceView.as_view(), name='total-balance'),
]
