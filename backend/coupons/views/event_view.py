from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..models import Event
from ..serializers import EventSerializer, EventCreateSerializer, EventUpdateSerializer
from ..services.event_service import create_event, update_event, delete_event


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related("discipline")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return EventCreateSerializer
        if self.action in ("update", "partial_update"):
            return EventUpdateSerializer
        return EventSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Event.objects.none()
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return Event.objects.none()
        return super().get_queryset()

    @swagger_auto_schema(
        operation_summary='List events',
        operation_description='Get list of all events',
        responses={
            200: openapi.Response('List of events', EventSerializer(many=True)),
            401: openapi.Response('Unauthorized'),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Create event',
        operation_description='Create a new event',
        request_body=EventCreateSerializer,
        responses={
            201: openapi.Response('Event created', EventSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
        }
    )
    def create(self, request, *args, **kwargs):
        in_ser = self.get_serializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        event = create_event(in_ser.validated_data)
        out_ser = EventSerializer(event, context={"request": request})
        return Response(out_ser.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_summary='Retrieve event',
        operation_description='Get event details by ID',
        responses={
            200: openapi.Response('Event details', EventSerializer),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Event not found'),
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Update event',
        operation_description='Update event details',
        request_body=EventUpdateSerializer,
        responses={
            200: openapi.Response('Event updated', EventSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Event not found'),
        }
    )
    def update(self, request, *args, **kwargs):
        event = self.get_object()
        in_ser = self.get_serializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        updated = update_event(event, in_ser.validated_data)
        out_ser = EventSerializer(updated, context={"request": request})
        return Response(out_ser.data)

    @swagger_auto_schema(
        operation_summary='Partial update event',
        operation_description='Partially update event details',
        request_body=EventUpdateSerializer,
        responses={
            200: openapi.Response('Event updated', EventSerializer),
            400: openapi.Response('Invalid data'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Event not found'),
        }
    )
    def partial_update(self, request, *args, **kwargs):
        event = self.get_object()
        in_ser = self.get_serializer(data=request.data, partial=True)
        in_ser.is_valid(raise_exception=True)
        updated = update_event(event, in_ser.validated_data)
        out_ser = EventSerializer(updated, context={"request": request})
        return Response(out_ser.data)

    @swagger_auto_schema(
        operation_summary='Delete event',
        operation_description='Delete event by ID',
        responses={
            204: openapi.Response('Event deleted'),
            401: openapi.Response('Unauthorized'),
            404: openapi.Response('Event not found'),
        }
    )
    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        delete_event(event)
        return Response(status=status.HTTP_204_NO_CONTENT)
