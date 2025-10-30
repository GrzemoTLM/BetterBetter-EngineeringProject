from rest_framework import serializers
from ..models import Bet, BetTypeDict, Discipline


class BetSerializer(serializers.ModelSerializer):
    bet_type = serializers.SlugRelatedField(read_only=True, slug_field='code')
    discipline = serializers.SlugRelatedField(read_only=True, slug_field='code')

    class Meta:
        model = Bet
        fields = ['id', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'result']


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

    class Meta:
        model = Bet
        fields = ['event_name', 'bet_type', 'discipline', 'line', 'odds']


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

    class Meta:
        model = Bet
        fields = ['event_name', 'bet_type', 'discipline', 'line', 'odds']
        extra_kwargs = {
            'event_name': {'required': False},
            'line': {'required': False},
            'odds': {'required': False},
        }
