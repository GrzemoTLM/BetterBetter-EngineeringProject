from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Report(models.Model):
    class Frequency(models.TextChoices):
        DAILY = "DAILY", _("Daily")
        WEEKLY = "WEEKLY", _("Weekly")
        MONTHLY = "MONTHLY", _("Monthly")
        YEARLY = "YEARLY", _("Yearly")
        CUSTOM = "CUSTOM", _("Custom")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports",
        verbose_name=_("User"),
    )
    query = models.ForeignKey(
        'AnalyticsQuery',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
        verbose_name=_("Analytics Query"),
    )
    frequency = models.CharField(
        max_length=10,
        choices=Frequency.choices,
        default=Frequency.DAILY,
        verbose_name=_("Frequency"),
    )
    schedule_payload = models.JSONField(
        null=True,
        blank=True,
        help_text=_("Payload for scheduling the report, e.g., cron expressions."),
    )
    next_run = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Next Run Time"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
        help_text=_("Enable/disable report generation"),
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class DeliveryMethod(models.TextChoices):
        EMAIL = "email", _("Email")
        DASHBOARD = "dashboard", _("Dashboard")
        SMS = "sms", _("SMS")
        TELEGRAM = "telegram", _("Telegram")

    delivery_method = models.CharField(
        max_length=20,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.TELEGRAM,
        verbose_name=_("Delivery Method"),
    )
    delivery_methods = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Methods to deliver the report, e.g., ['email', 'dashboard']"),
    )
    class Meta:
        verbose_name = _("Report")
        verbose_name_plural = _("Reports")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report {self.id} for {self.user.username}"
