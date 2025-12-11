from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class TicketCategory(models.Model):

    class CategoryChoices(models.TextChoices):
        BUG = 'bug', _('Bug')
        FEATURE_REQUEST = 'feature_request', _('Feature Request')
        ACCOUNT = 'account', _('Account Issue')
        PAYMENT = 'payment', _('Payment Issue')
        OTHER = 'other', _('Other')

    name = models.CharField(
        max_length=50,
        choices=CategoryChoices.choices,
        primary_key=True
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ticket_categories"
        verbose_name = _('Ticket Category')
        verbose_name_plural = _('Ticket Categories')

    def __str__(self):
        return self.get_name_display()


class Ticket(models.Model):

    class StatusChoices(models.TextChoices):
        OPEN = 'open', _('Open')
        IN_PROGRESS = 'in_progress', _('In Progress')
        RESOLVED = 'resolved', _('Resolved')
        CLOSED = 'closed', _('Closed')

    class PriorityChoices(models.TextChoices):
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        CRITICAL = 'critical', _('Critical')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name=_('User')
    )
    title = models.CharField(
        max_length=255,
        verbose_name=_('Title')
    )
    description = models.TextField(
        verbose_name=_('Description')
    )
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        verbose_name=_('Category')
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.OPEN,
        verbose_name=_('Status')
    )
    priority = models.CharField(
        max_length=20,
        choices=PriorityChoices.choices,
        default=PriorityChoices.MEDIUM,
        verbose_name=_('Priority')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Created At')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Updated At')
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Resolved At')
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name=_('Assigned To')
    )

    class Meta:
        db_table = "tickets"
        verbose_name = _('Ticket')
        verbose_name_plural = _('Tickets')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"


class TicketComment(models.Model):

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('Ticket')
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ticket_comments',
        verbose_name=_('Author')
    )
    content = models.TextField(
        verbose_name=_('Content')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Created At')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Updated At')
    )
    is_staff_comment = models.BooleanField(
        default=False,
        verbose_name=_('Staff Comment')
    )

    class Meta:
        db_table = 'ticket_comments'
        verbose_name = _('Ticket Comment')
        verbose_name_plural = _('Ticket Comments')
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.ticket}"

