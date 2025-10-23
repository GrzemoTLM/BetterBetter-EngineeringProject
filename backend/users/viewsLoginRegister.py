import uuid
from idlelib.debugobj_r import remote_object_tree_item
from lib2to3.pgen2.tokenize import TokenError

from django.http import JsonResponse
from django.shortcuts import render
from django.core.cache import cache
from django_otp.plugins.otp_email.models import EmailDevice
from rest_framework import viewsets, generics
from rest_framework.decorators import permission_classes
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, GoogleAuthSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, csrf_protect



from .models import User, UserSettings
from .serializers import UserSerializer

class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(generics.CreateAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    LOGIN_2FA_CACHE_PREFIX = "login-2fa:"
    LOGIN_2FA_TTL = 300

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        settings = UserSettings.objects.filter(user=user).first()

        if settings and settings.two_factor_enabled:
            method = (settings.two_factor_method or '').strip().lower()
            if method not in ['totp', 'email']:
                return Response({'error': '2FA method not set. Start setup first.'},
                                status=status.HTTP_400_BAD_REQUEST)

            challenge_id = str(uuid.uuid4())
            cache.set(
                f"{self.LOGIN_2FA_CACHE_PREFIX}{challenge_id}",
                {"user_id": user.id, "method": method},
                timeout=self.LOGIN_2FA_TTL,
            )
            if method == 'email':
                device = (
                        EmailDevice.objects.filter(user=user, name="email_device").first()
                        or EmailDevice.objects.filter(user=user).first()
                )
                if device:
                    device.generate_challenge()

            return Response(
            {
                "2fa_required": True,
                "method": method,
                "challenge_id": challenge_id,
                "ttl": self.LOGIN_2FA_TTL,
                },
                status=status.HTTP_200_OK
            )

        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
            },
            status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        refresh_token = request.headers.get('Refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_400_BAD_REQUEST)

        logout(request)
        return Response({'detail': 'Successfully logged out'}, status=status.HTTP_200_OK)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        return Response(UserSerializer(user).data)

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    serializer_class = GoogleAuthSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        return Response({
            'user': data['user'],
            'refresh': data['refresh'],
            'access': data['access'],
            'new_user': data['new_user'],
        }, status=status.HTTP_200_OK)

def google_login_succes(request):
    if request.user.is_authenticated:
        return (JsonResponse
                ({'message': 'Google login successful',
                'user': UserSerializer(request.user).data
             })
                )
    return None
