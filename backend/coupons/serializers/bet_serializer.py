from rest_framework import serializers
from ..models import Bet, BetTypeDict, Discipline, Event


class FlexibleRelatedField(serializers.PrimaryKeyRelatedField):
    """Field that accepts both ID (int) and code (string)"""
    def __init__(self, slug_field='code', **kwargs):
        self.slug_field = slug_field
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if isinstance(data, str) and not data.isdigit():
            try:
                return self.get_queryset().get(**{self.slug_field: data.upper()})
            except self.get_queryset().model.DoesNotExist:
                self.fail('does_not_exist', pk_value=data)
        return super().to_internal_value(data)


class BetSerializer(serializers.ModelSerializer):
    bet_type = serializers.SlugRelatedField(read_only=True, slug_field='code')
    discipline = serializers.SlugRelatedField(read_only=True, slug_field='code')
    event = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Bet
        fields = ['id', 'event', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'result']


class BetCreateSerializer(serializers.ModelSerializer):

    bet_type = FlexibleRelatedField(
        queryset=BetTypeDict.objects.all(),
        slug_field='code',
        required=False,
        allow_null=True
    )
    discipline = FlexibleRelatedField(
        queryset=Discipline.objects.all(),
        slug_field='code',
        allow_null=True,
        required=False
    )
    event = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), allow_null=True, required=False
    )
    event_name = serializers.CharField(required=False, allow_blank=True)
    line = serializers.CharField(required=False, allow_blank=True)
    odds = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    start_time = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Bet
        fields = ['event', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'start_time']


class ResultChoiceField(serializers.ChoiceField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            normalized = data.strip().lower()
            alias_map = {
                'won': 'win',
                'win': 'win',
                'lose': 'lost',
                'lost': 'lost',
                'cancel': 'canceled',
                'canceled': 'canceled',
                'cancelled': 'canceled',
                'void': 'canceled',
                'push': 'canceled',
            }
            data = alias_map.get(normalized, normalized)
        return super().to_internal_value(data)


class BetUpdateSerializer(serializers.ModelSerializer):
    bet_type = FlexibleRelatedField(
        queryset=BetTypeDict.objects.all(),
        slug_field='code',
        required=False
    )
    discipline = FlexibleRelatedField(
        queryset=Discipline.objects.all(),
        slug_field='code',
        allow_null=True,
        required=False
    )
    event = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), allow_null=True, required=False
    )
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    result = ResultChoiceField(choices=Bet.BetResult.choices, required=False, allow_null=True)

    class Meta:
        model = Bet
        fields = ['event', 'event_name', 'bet_type', 'discipline', 'line', 'odds', 'start_time', 'result']
        extra_kwargs = {
            'event_name': {'required': False},
            'line': {'required': False},
            'odds': {'required': False},
            'result': {'required': False},
        }
