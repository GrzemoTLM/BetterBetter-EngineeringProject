from rest_framework import serializers
from ..models import BetTypeDict, Discipline


class BetTypeDictSerializer(serializers.ModelSerializer):
    disciplines = serializers.PrimaryKeyRelatedField(
        queryset=Discipline.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = BetTypeDict
        fields = ['id', 'code', 'description', 'disciplines']
