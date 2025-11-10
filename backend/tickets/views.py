from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext_lazy as _

from .models import Ticket, TicketCategory, TicketComment
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketUpdateStatusSerializer,
    AddCommentSerializer,
    TicketCategorySerializer,
    TicketCommentSerializer
)
from .services.ticket_service import TicketService
from .services.comment_service import CommentService


class IsOwnerOrStaff(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        if isinstance(obj, Ticket):
            return obj.user == request.user
        if isinstance(obj, TicketComment):
            return obj.author == request.user or request.user.is_staff
        return False


class TicketCategoryViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = TicketCategory.objects.all()
    serializer_class = TicketCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TicketViewSet(viewsets.ModelViewSet):

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        return TicketService.get_user_tickets(self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TicketCreateSerializer
        elif self.action == 'update_status':
            return TicketUpdateStatusSerializer
        elif self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketListSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_comment(self, request, pk=None):
        ticket = self.get_object()
        serializer = AddCommentSerializer(data=request.data)

        if serializer.is_valid():
            comment = CommentService.create_comment(
                ticket=ticket,
                author=request.user,
                content=serializer.validated_data['content'],
                is_staff=request.user.is_staff
            )
            return Response(
                TicketCommentSerializer(comment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketUpdateStatusSerializer(ticket, data=request.data, partial=True)

        if serializer.is_valid():
            ticket = TicketService.update_ticket_status(
                ticket=ticket,
                status=serializer.validated_data.get('status'),
                resolved_at=serializer.validated_data.get('resolved_at')
            )
            return Response(
                TicketDetailSerializer(ticket).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        comments = CommentService.get_ticket_comments(ticket.id)
        serializer = TicketCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_open_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user, status='open')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_resolved_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user, status='resolved')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_in_progress_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user, status='in_progress')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def unresolved(self, request):
        tickets = TicketService.get_unresolved_tickets()
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def all_users_tickets(self, request):
        if not request.user.is_superuser:
            return Response(
                {'detail': str(_('Only superuser has access to this endpoint.'))},
                status=status.HTTP_403_FORBIDDEN
            )
        tickets = TicketService.get_all_tickets()
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)


class TicketCommentViewSet(viewsets.ModelViewSet):

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    serializer_class = TicketCommentSerializer

    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket_id')
        return CommentService.filter_comments_by_ticket(ticket_id)

    def perform_create(self, serializer):
        ticket_id = self.request.data.get('ticket_id')
        if not ticket_id:
            raise ValueError(str(_('ticket_id is required')))
        comment = CommentService.add_comment_to_ticket(
            ticket_id=ticket_id,
            author=self.request.user,
            content=serializer.validated_data['content']
        )
        serializer.instance = comment

