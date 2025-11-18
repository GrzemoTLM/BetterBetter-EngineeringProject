from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext_lazy as _
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

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

    @swagger_auto_schema(
        operation_summary='List ticket categories',
        operation_description='Get list of all ticket categories',
        responses={
            200: openapi.Response('List of categories', TicketCategorySerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Retrieve ticket category',
        operation_description='Get category details by ID',
        responses={
            200: openapi.Response('Category details', TicketCategorySerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Category not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


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

    @swagger_auto_schema(
        operation_summary='List tickets',
        operation_description='Get list of user tickets with optional filtering and searching',
        responses={
            200: openapi.Response('List of tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create ticket',
        operation_description='Create a new support ticket',
        request_body=TicketCreateSerializer,
        responses={
            201: openapi.Response('Ticket created', TicketDetailSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Retrieve ticket',
        operation_description='Get ticket details by ID',
        responses={
            200: openapi.Response('Ticket details', TicketDetailSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Ticket not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update ticket',
        operation_description='Update ticket (PUT)',
        request_body=TicketCreateSerializer,
        responses={
            200: openapi.Response('Ticket updated', TicketDetailSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Ticket not found'),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Partial update ticket',
        operation_description='Partially update ticket (PATCH)',
        request_body=TicketCreateSerializer,
        responses={
            200: openapi.Response('Ticket updated', TicketDetailSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Ticket not found'),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete ticket',
        operation_description='Delete a ticket',
        responses={
            204: openapi.Response('Ticket deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Ticket not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    @swagger_auto_schema(
        operation_summary='Add comment to ticket',
        operation_description='Add a new comment to a support ticket',
        request_body=AddCommentSerializer,
        responses={
            201: openapi.Response('Comment created', TicketCommentSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Ticket not found'),
        }
    )
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
    @swagger_auto_schema(
        operation_summary='Update ticket status',
        operation_description='Update ticket status (admin only)',
        request_body=TicketUpdateStatusSerializer,
        responses={
            200: openapi.Response('Ticket updated', TicketDetailSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Admin access required'),
            404: openapi.Response('Ticket not found'),
        }
    )
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
    @swagger_auto_schema(
        operation_summary='Get ticket comments',
        operation_description='Get all comments for a specific ticket',
        responses={
            200: openapi.Response('List of comments', TicketCommentSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Ticket not found'),
        }
    )
    def comments(self, request, pk=None):
        ticket = self.get_object()
        comments = CommentService.get_ticket_comments(ticket.id)
        serializer = TicketCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @swagger_auto_schema(
        operation_summary='List user tickets',
        operation_description='Get all tickets for authenticated user',
        responses={
            200: openapi.Response('List of user tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def my_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @swagger_auto_schema(
        operation_summary='List open tickets',
        operation_description='Get all open tickets for authenticated user',
        responses={
            200: openapi.Response('List of open tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def my_open_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user, status='open')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @swagger_auto_schema(
        operation_summary='List resolved tickets',
        operation_description='Get all resolved tickets for authenticated user',
        responses={
            200: openapi.Response('List of resolved tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def my_resolved_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user, status='resolved')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    @swagger_auto_schema(
        operation_summary='List in-progress tickets',
        operation_description='Get all in-progress tickets for authenticated user',
        responses={
            200: openapi.Response('List of in-progress tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def my_in_progress_tickets(self, request):
        tickets = self.get_queryset().filter(user=request.user, status='in_progress')
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    @swagger_auto_schema(
        operation_summary='List unresolved tickets',
        operation_description='Get all unresolved tickets (admin only)',
        responses={
            200: openapi.Response('List of unresolved tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Admin access required'),
        }
    )
    def unresolved(self, request):
        tickets = TicketService.get_unresolved_tickets()
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    @swagger_auto_schema(
        operation_summary='List all user tickets',
        operation_description='Get all tickets from all users (superuser only)',
        responses={
            200: openapi.Response('List of all tickets', TicketListSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Superuser access required'),
        }
    )
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

    @swagger_auto_schema(
        operation_summary='List comments',
        operation_description='Get comments for a specific ticket (use query param ticket_id)',
        manual_parameters=[
            openapi.Parameter('ticket_id', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, required=False, description='Filter by ticket ID'),
        ],
        responses={
            200: openapi.Response('List of comments', TicketCommentSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create comment',
        operation_description='Add a new comment to a ticket',
        request_body=TicketCommentSerializer,
        responses={
            201: openapi.Response('Comment created', TicketCommentSerializer),
            400: openapi.Response('Invalid data or missing ticket_id'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Retrieve comment',
        operation_description='Get comment details by ID',
        responses={
            200: openapi.Response('Comment details', TicketCommentSerializer),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Permission denied'),
            404: openapi.Response('Comment not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update comment',
        operation_description='Update a comment (PUT)',
        request_body=TicketCommentSerializer,
        responses={
            200: openapi.Response('Comment updated', TicketCommentSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Permission denied'),
            404: openapi.Response('Comment not found'),
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Partial update comment',
        operation_description='Partially update a comment (PATCH)',
        request_body=TicketCommentSerializer,
        responses={
            200: openapi.Response('Comment updated', TicketCommentSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Permission denied'),
            404: openapi.Response('Comment not found'),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Delete comment',
        operation_description='Delete a comment',
        responses={
            204: openapi.Response('Comment deleted'),
            401: openapi.Response('Unauthorized'),
            403: openapi.Response('Permission denied'),
            404: openapi.Response('Comment not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

