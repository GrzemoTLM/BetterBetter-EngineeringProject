from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class UserStrategy(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="betting_strategies",
        verbose_name=_("User"),
    )

    name = models.CharField(
        max_length=100,
        verbose_name=_("Strategy Name"),
        help_text=_("e.g., 'Conservative', 'Aggressive', 'Flat Stake'"),
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Detailed description of the strategy"),
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At"),
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At"),
    )

    class Meta:
        verbose_name = _("User Strategy")
        verbose_name_plural = _("User Strategies")
        ordering = ["-created_at"]
        unique_together = [["user", "name"]]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.name}"

