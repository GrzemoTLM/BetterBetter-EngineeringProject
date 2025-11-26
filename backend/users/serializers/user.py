from rest_framework import serializers
from ..models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'status', 'registered_at', 'is_superuser']
        extra_kwargs = {
            'is_superuser': {'read_only': True}
        }
