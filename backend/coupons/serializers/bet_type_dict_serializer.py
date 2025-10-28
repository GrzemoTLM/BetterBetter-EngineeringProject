from rest_framework import serializers
from ..models import BetTypeDict

class BetTypeDictSerializer(serializers.ModelSerializer):
    code = serializers.CharField()
    description = serializers.CharField()

    class Meta:
        model = BetTypeDict
        fields = ['code', 'description']
