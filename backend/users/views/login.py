from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import UserSettings
from ..serializers import LoginSerializer, UserSerializer
from ..services.auth_service import AuthService
from ..services.two_factor_service import TwoFactorService


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(generics.CreateAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = AuthService.authenticate_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )

            settings = UserSettings.objects.filter(user=user).first()

            if settings and settings.two_factor_enabled:
                method = (settings.two_factor_method or '').strip().lower()
                if method not in ['totp', 'email']:
                    return Response(
                        {'error': '2FA method not set. Start setup first.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                challenge_id = TwoFactorService.create_2fa_login_challenge(user, method)

                return Response({
                    "2fa_required": True,
                    "method": method,
                    "challenge_id": challenge_id,
                    "ttl": TwoFactorService.LOGIN_2FA_TTL,
                }, status=status.HTTP_200_OK)

            login(request, user)
            tokens = AuthService.generate_tokens(user)

            return Response({
                'user': UserSerializer(user).data,
                'refresh': tokens['refresh'],
                'access': tokens['access'],
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

