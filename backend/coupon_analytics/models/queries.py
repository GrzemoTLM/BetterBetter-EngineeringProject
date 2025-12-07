from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from common.choices import CouponType
from coupons.models import Bookmaker

class AnalyticsQuery(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="analytics_queries",
        verbose_name="User",
    )
    name = models.CharField(
        max_length=255,
        verbose_name="Query Name"
    )

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    bookmaker = models.ForeignKey(
        Bookmaker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics_queries",
        verbose_name="Bookmaker",
    )
    statuses = models.JSONField(
        default=list,
        blank=True,
        help_text="e.g. ['won','lost','in_progress']"
    )
    coupon_type = models.CharField(
        max_length=10,
        choices=CouponType.choices,
        null=True, blank=True,
    )
    query = models.JSONField(
        null=True,
        blank=True,
        help_text="(Deprecated) Use QueryGroup/QueryCondition instead.",
    )
    group_by = models.JSONField(
        default=list,
        blank=True,
        help_text="Fields to group by, e.g. ['bookmaker', 'status']"
    )
    sort_by = models.JSONField(
        default=list,
        blank=True,
        help_text="Fields to sort by, e.g. ['-created_at', 'bookmaker']"
    )
    metrics = models.JSONField(
        default=list,
        blank=True,
        help_text="Metrics to calculate, e.g. ['total_stake', 'total_return']"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analytics_query"
        verbose_name = "Analytics Query"
        verbose_name_plural = "Analytics Queries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"AnalyticsQuery {self.id} - {self.name}"


class AnalyticsQueryGroup(models.Model):
    analytics_query = models.ForeignKey(
        AnalyticsQuery,
        on_delete=models.CASCADE,
        related_name="query_groups",
        verbose_name="Analytics Query this group belongs to",
    )
    operator = models.CharField(
        max_length=3,
        choices=[("AND", "AND"), ("OR", "OR")],
        default="AND",
        verbose_name="Operator",
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subgroups",
        verbose_name="Parent Group",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order of this group within its parent group.",
    )

    class Meta:
        db_table = "analytics_query_group"
        verbose_name = "Analytics Query Group"
        verbose_name_plural = "Analytics Query Groups"
        ordering = ["analytics_query", "parent_id", "order"]

    def __str__(self):
        return f"Group {self.id} of Query {self.analytics_query.id}"


class AnalyticsQueryCondition(models.Model):
    class Operator(models.TextChoices):
        EQUALS = 'equals',_('Equals')
        NOT_EQUALS = 'not_equals', _('Not Equals')
        CONTAINS = 'contains', _('Contains')
        NOT_CONTAINS = 'not_contains', _('Not Contains')
        GT = 'gt', _('Greater Than')
        GTE = 'gte', _('Greater Than or Equal')
        LT = 'lt', _('Less Than')
        LTE = 'lte', _('Less Than or Equal')
        IN = 'in', _('In')
        NOT_IN = 'not_in', _('Not In')

    group = models.ForeignKey(
        AnalyticsQueryGroup,
        on_delete=models.CASCADE,
        related_name='conditions'
    )
    field = models.CharField(
        max_length=255,
        help_text= _('eg. coupon_type')
    )
    operator = models.CharField(
        max_length=20,
        choices=Operator.choices,
    )
    value = models.JSONField(
        default=list,
        help_text=_("Value or value list")
    )
    negate = models.BooleanField(
        default=False,
        help_text=_("Negates whole condition")
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analytics_query_condition"
        verbose_name = _('Query Condition')
        verbose_name_plural = _('Query Conditions')
        ordering = ['group','order']

    def __str__(self) -> str:
        return f"Query Condition {self.id} - {self.operator} - {self.value}"