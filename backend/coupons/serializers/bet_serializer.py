from rest_framework import serializers
from ..models import Bet, BetTypeDict, Discipline, Event


class BetSerializer(serializers.ModelSerializer):
    bet_type = serializers.SlugRelatedField(read_only=True, slug_field='code')
    discipline = serializers.SlugRelatedField(read_only=True, slug_field='code')
    event = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Bet
        fields = ['id', 'event', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'result']


class BetCreateSerializer(serializers.ModelSerializer):
    bet_type = serializers.SlugRelatedField(
        slug_field='code',
        queryset=BetTypeDict.objects.all()
    )
    discipline = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Discipline.objects.all(),
        allow_null=True,
        required=False
    )
    event = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), allow_null=True, required=False
    )
    start_time = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Bet
        fields = ['event', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'start_time']


class BetUpdateSerializer(serializers.ModelSerializer):
    bet_type = serializers.SlugRelatedField(
        slug_field='code',
        queryset=BetTypeDict.objects.all(),
        required=False
    )
    discipline = serializers.SlugRelatedField(
        slug_field='code',
        queryset=Discipline.objects.all(),
        allow_null=True,
        required=False
    )
    event = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), allow_null=True, required=False
    )
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    result = serializers.ChoiceField(choices=Bet.BetResult.choices, required=False, allow_null=True)

    class Meta:
        model = Bet
        fields = ['event', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'start_time', 'result']
        extra_kwargs = {
            'event_name': {'required': False},
            'line': {'required': False},
            'odds': {'required': False},
            'result': {'required': False},
        }
