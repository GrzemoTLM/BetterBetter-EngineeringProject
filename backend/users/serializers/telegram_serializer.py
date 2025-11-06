from rest_framework import serializers
from users.models import TelegramAuthCode, TelegramUser


class TelegramAuthCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramAuthCode
        fields = ['code', 'created_at', 'expires_at']
        read_only_fields = ['code', 'created_at', 'expires_at']

class ConnectTelegramSerializer(serializers.Serializer):
    telegram_id = serializers.IntegerField()
    code = serializers.CharField()

class TelegramUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramUser
        fields = ['telegram_id', 'telegram_username', 'created_at']
        read_only_fields = ['created_at']


