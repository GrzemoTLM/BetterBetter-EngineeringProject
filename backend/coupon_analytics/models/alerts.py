from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class AlertRule(models.Model):
    class Comparator(models.TextChoices):
        LT = "lt", _("Less than")
        LTE = "lte", _("Less or equal")
        GT = "gt", _("Greater than")
        GTE = "gte", _("Greater or equal")
        EQ = "eq", _("Equal")

    class RuleType(models.TextChoices):
        ROI = "roi", _("ROI")
        YIELD = "yield", _("Yield")
        LOSS = "loss", _("Loss amount")
        STREAK_LOSS = "streak_loss", _("Consecutive losses")
        CUSTOM = "custom", _("Custom")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alert_rules",
        verbose_name=_("User"),
    )
    analytics_query = models.ForeignKey(
        "coupon_analytics.AnalyticsQuery",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alert_rules",
        verbose_name=_("Analytics Query"),
    )
    rule_type = models.CharField(
        max_length=20,
        choices=RuleType.choices,
        default=RuleType.YIELD,
        verbose_name=_("Rule Type"),
    )
    metric = models.CharField(
        max_length=50,
        help_text=_("Metric to evaluate, e.g., 'roi', 'yield'"),
        verbose_name=_("Metric"),
    )
    comparator = models.CharField(
        max_length=10,
        choices=Comparator.choices,
        default=Comparator.LT,
        verbose_name=_("Comparator"),
    )
    threshold_value = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        verbose_name=_("Threshold"),
        help_text=_("Example: ROI -0.1000 for -10%. Loss 500.00 etc."),
    )
    window_days = models.PositiveIntegerField(
        default=30,
        verbose_name=_("Window (days)"),
    )
    message = models.CharField(
        max_length=255,
        verbose_name=_("Alert Message"),
        help_text=_("Message to include in the alert notification."),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is active"))
    last_triggered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Last triggered at")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created at"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated at"))

    class Meta:
        verbose_name = _("Alert Rule")
        verbose_name_plural = _("Alert Rules")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Alert #{self.pk} • {self.metric} {self.comparator} {self.threshold_value}"