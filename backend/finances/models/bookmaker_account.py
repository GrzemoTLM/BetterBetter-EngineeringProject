from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from coupons.models import Currency
from coupons.models import Bookmaker

class BookmakerAccountModel(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmaker_accounts'
    )
    bookmaker = models.ForeignKey(
        Bookmaker,
        on_delete=models.PROTECT,
        related_name='accounts'
    )
    alias = models.CharField(
        max_length=255,
        help_text="An optional alias for the bookmaker account (e.g., 'My STS Account')",
        blank=True,
        null=True
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        default=1,
        verbose_name=_("currency"),
    )
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Current balance of the bookmaker account"
    )
    website = models.URLField(
        max_length=500,
        help_text="Website URL of the bookmaker",
        blank=True,
        null=True
    )
    active = models.BooleanField(
        default=True,
        help_text="Indicates whether the bookmaker account is active"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when the bookmaker account was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the bookmaker account was last updated"
    )
    class Meta:
        verbose_name = "Bookmaker Account"
        verbose_name_plural = "Bookmaker Accounts"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "bookmaker"],
                name="uniq_user_bookmaker",
            )
        ]
        indexes = [
            models.Index(fields=["user", "active"], name="idx_ba_user_active"),
            models.Index(fields=["user", "bookmaker", "alias", "id"], name="idx_ba_user_book_alias_id"),
            models.Index(fields=["bookmaker"], name="idx_ba_bookmaker"),
        ]
        ordering = ["bookmaker_id", "alias", "id"]

# python

    def __str__(self):
        return f"{self.bookmaker.name} - {self.alias}" if self.alias else f"{self.bookmaker.name} Account"

    @property
    def display_name(self):
        return f"{self.bookmaker.name} ({self.alias})" if    self.alias else self.bookmaker.name