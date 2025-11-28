from rest_framework import serializers
from ..models import BetTypeDict, Discipline

class BetTypeDictSerializer(serializers.ModelSerializer):
    code = serializers.CharField()
    description = serializers.CharField()
    discipline = serializers.PrimaryKeyRelatedField(queryset=Discipline.objects.all())

    class Meta:
        model = BetTypeDict
        fields = ['id', 'code', 'description', 'discipline']
