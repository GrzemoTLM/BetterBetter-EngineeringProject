from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

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

    def create(self, request, *args, **kwargs):
        in_ser = self.get_serializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        event = create_event(in_ser.validated_data)
        out_ser = EventSerializer(event, context={"request": request})
        return Response(out_ser.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        event = self.get_object()
        in_ser = self.get_serializer(data=request.data)
        in_ser.is_valid(raise_exception=True)
        updated = update_event(event, in_ser.validated_data)
        out_ser = EventSerializer(updated, context={"request": request})
        return Response(out_ser.data)

    def partial_update(self, request, *args, **kwargs):
        event = self.get_object()
        in_ser = self.get_serializer(data=request.data, partial=True)
        in_ser.is_valid(raise_exception=True)
        updated = update_event(event, in_ser.validated_data)
        out_ser = EventSerializer(updated, context={"request": request})
        return Response(out_ser.data)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        delete_event(event)
        return Response(status=status.HTTP_204_NO_CONTENT)
