from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..models import Ticket, TicketComment


class TicketService:

    @staticmethod
    def get_user_tickets(user):
        if user.is_staff:
            return Ticket.objects.all().select_related(
                'user', 'assigned_to', 'category'
            ).prefetch_related('comments')
        return Ticket.objects.filter(
            user=user
        ).select_related(
            'user', 'assigned_to', 'category'
        ).prefetch_related('comments')

    @staticmethod
    def create_ticket(user, title, description, category=None, priority='medium'):
        ticket = Ticket.objects.create(
            user=user,
            title=title,
            description=description,
            category=category,
            priority=priority
        )
        return ticket

    @staticmethod
    def update_ticket_status(ticket, status, resolved_at=None):
        ticket.status = status
        if status == 'resolved' and not resolved_at:
            ticket.resolved_at = timezone.now()
        elif resolved_at:
            ticket.resolved_at = resolved_at
        ticket.save()
        return ticket

    @staticmethod
    def get_unresolved_tickets():
        return Ticket.objects.exclude(status='closed').select_related(
            'user', 'assigned_to', 'category'
        ).prefetch_related('comments')

    @staticmethod
    def get_all_tickets():
        return Ticket.objects.all().select_related(
            'user', 'assigned_to', 'category'
        ).prefetch_related('comments')

    @staticmethod
    def assign_ticket(ticket, user):
        ticket.assigned_to = user
        ticket.save()
        return ticket

