from django.shortcuts import get_object_or_404
from ..models import Ticket, TicketComment


class CommentService:

    @staticmethod
    def get_ticket_comments(ticket_id):
        return TicketComment.objects.filter(
            ticket_id=ticket_id
        ).select_related('author', 'ticket')

    @staticmethod
    def create_comment(ticket, author, content, is_staff=False):
        comment = TicketComment.objects.create(
            ticket=ticket,
            author=author,
            content=content,
            is_staff_comment=is_staff
        )
        return comment

    @staticmethod
    def get_comments_by_ticket_id(ticket_id):
        return TicketComment.objects.filter(
            ticket_id=ticket_id
        ).select_related('author', 'ticket').order_by('created_at')

    @staticmethod
    def add_comment_to_ticket(ticket_id, author, content):
        ticket = get_object_or_404(Ticket, pk=ticket_id)
        return CommentService.create_comment(
            ticket=ticket,
            author=author,
            content=content,
            is_staff=author.is_staff
        )

    @staticmethod
    def get_all_comments():
        return TicketComment.objects.select_related('author', 'ticket')

    @staticmethod
    def filter_comments_by_ticket(ticket_id=None):
        queryset = TicketComment.objects.select_related('author', 'ticket')
        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)
        return queryset

