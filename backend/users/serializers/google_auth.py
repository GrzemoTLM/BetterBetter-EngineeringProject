from rest_framework import serializers


class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, required=True)


