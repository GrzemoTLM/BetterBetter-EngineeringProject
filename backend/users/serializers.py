import email

from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from .models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'status', 'registered_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'registered_at']
        read_only_fields = ['id', 'registered_at']
        extra_kwargs = {'password': {'write_only': True}}
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            password=make_password(validated_data['password'])
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")
        user = authenticate(username=user.username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User is not active")
        data['user'] = user
        return user

class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, required=True)
    def validate(self, data):
        token = data.get("token")
        try:
            idinfo = id_token.verify_oauth2_token(token,requests.Request(),settings.GOOGLE_CLIENT_ID)
            email = idinfo.get("email")
            name = idinfo.get("name")

            if not email:
                raise serializers.ValidationError("No google account")

            user,created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": name or email.split("@")[0],
                }
            )
            refresh = RefreshToken.for_user(user)

            return {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "new_user": created,
            }
        except ValueError:
            raise serializers.ValidationError("Invalid or expired Google token")
