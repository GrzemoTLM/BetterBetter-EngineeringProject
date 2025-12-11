from django.db import models
from django.conf import settings
from django.utils import timezone

class YieldAlert(models.Model):
    class Period(models.TextChoices):
        WEEK = 'week', 'Week'
        MONTH = 'month', 'Month'
        YEAR = 'year', 'Year'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='yield_alerts'
    )
    period = models.CharField(max_length=10, choices=Period.choices)
    period_start = models.DateField()
    period_end = models.DateField()
    yield_value = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    triggered_at = models.DateTimeField(default=timezone.now)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "analytics_yield_alert"
        unique_together = ('user', 'period', 'period_start')
        ordering = ['-period_start']

    def __str__(self):
        return f"YieldAlert(user={self.user_id}, period={self.period}, start={self.period_start}, yield={self.yield_value})"
