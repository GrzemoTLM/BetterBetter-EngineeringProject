from rest_framework import serializers

from ..models import Event, Discipline
from common.serializers.fields import UserAwareDateTimeField


class EventSerializer(serializers.ModelSerializer):
    discipline = serializers.SlugRelatedField(read_only=True, slug_field="code")
    created_at = UserAwareDateTimeField(read_only=True)
    updated_at = UserAwareDateTimeField(read_only=True)
    start_time = UserAwareDateTimeField()

    class Meta:
        model = Event
        fields = (
            "id",
            "name",
            "discipline",
            "start_time",
            "created_at",
            "updated_at",
        )


class EventCreateSerializer(serializers.ModelSerializer):
    discipline = serializers.SlugRelatedField(slug_field="code", queryset=Discipline.objects.all())
    start_time = serializers.DateTimeField()

    class Meta:
        model = Event
        fields = (
            "name",
            "discipline",
            "start_time",
        )


class EventUpdateSerializer(serializers.ModelSerializer):
    discipline = serializers.SlugRelatedField(slug_field="code", queryset=Discipline.objects.all(), required=False)
    start_time = serializers.DateTimeField(required=False)
    name = serializers.CharField(required=False)

    class Meta:
        model = Event
        fields = (
            "name",
            "discipline",
            "start_time",
        )

