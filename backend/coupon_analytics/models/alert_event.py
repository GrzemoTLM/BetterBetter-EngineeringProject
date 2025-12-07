from django.db import models
from django.conf import settings
from django.utils import timezone

from .alerts import AlertRule


class AlertEvent(models.Model):

    rule = models.ForeignKey(
        AlertRule,
        on_delete=models.CASCADE,
        related_name="alert_events",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alert_events",
    )
    metric = models.CharField(max_length=50)
    comparator = models.CharField(max_length=10)
    threshold_value = models.DecimalField(max_digits=18, decimal_places=6)
    metric_value = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    window_start = models.DateTimeField()
    window_end = models.DateTimeField()
    triggered_at = models.DateTimeField(default=timezone.now)
    sent_at = models.DateTimeField(null=True, blank=True)
    message_rendered = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "analytics_alert_event"
        unique_together = ("rule", "window_start", "window_end")
        ordering = ["-triggered_at"]

    def __str__(self) -> str:
        return f"AlertEvent(rule={self.rule_id}, metric={self.metric}, value={self.metric_value})"

