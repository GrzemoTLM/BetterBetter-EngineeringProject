from __future__ import annotations
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.db import models
from django.utils import timezone

from ..models.bookmaker_account import BookmakerAccountModel

class TransactionType(models.TextChoices):
    DEPOSIT = 'DEPOSIT', 'Deposit'
    WITHDRAWAL = 'WITHDRAWAL', 'Withdrawal'

class Transaction(models.Model):
    bookmaker_account = models.ForeignKey(
        BookmakerAccountModel,
        on_delete=models.SET_NULL,
        related_name='transactions',
        null=True,
        verbose_name=_("bookmaker account"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name=_("user"),
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_("Amount of the transaction"),
        verbose_name=_("amount"),
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
        verbose_name=_("transaction type"),
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text=_("Timestamp when the transaction was created"),
        verbose_name=_("created at"),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=_("Timestamp when the transaction was last updated"),
        verbose_name=_("updated at"),
    )

    def __str__(self):
        type_display = self.get_transaction_type_display()
        if self.bookmaker_account and getattr(self.bookmaker_account, "bookmaker", None):
            bookmaker_name = self.bookmaker_account.bookmaker.name
            return f"{type_display} {self.amount} — {bookmaker_name}"
        return f"{type_display} {self.amount}"

    @property
    def display_name(self):
        return str(self)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.account = self.bookmaker_account

    @property
    def currency(self):
        return self.account.currency if self.account else None

    class Meta:
        db_table = "finance_transactions"
        verbose_name = _("transaction")
        verbose_name_plural = _("transactions")
        indexes = [
            models.Index(fields=["user", "transaction_type"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at", "id"]
