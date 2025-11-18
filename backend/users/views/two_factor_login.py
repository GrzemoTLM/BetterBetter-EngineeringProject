from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from ..serializers import UserSerializer
from ..services.two_factor_service import TwoFactorService
from ..services.auth_service import AuthService


class TwoFactorLoginView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary='Verify 2FA login',
        operation_description='Verify 2FA code during login process',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'challenge_id': openapi.Schema(type=openapi.TYPE_STRING, description='2FA challenge ID'),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description='Verification code'),
            },
            required=['challenge_id', 'code']
        ),
        responses={
            200: openapi.Response('Login verified, tokens issued'),
            400: openapi.Response('Invalid challenge or code'),
        }
    )
    def post(self, request):
        challenge_id = str(request.data.get('challenge_id') or "").strip()
        code = str(request.data.get('code') or "").strip()

        if not challenge_id or not code:
            return Response(
                {'error': 'Challenge ID and code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Weryfikuj challenge i kod
            user = TwoFactorService.verify_2fa_login_challenge(challenge_id, code)

            # Wygeneruj tokeny
            tokens = AuthService.generate_tokens(user)

            return Response({
                "user": UserSerializer(user).data,
                "refresh": tokens['refresh'],
                "access": tokens['access'],
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
from .user import UserView
from .register import RegisterView
from .login import LoginView
from .logout import LogoutView
from .me import MeView
from .google_auth import GoogleAuthView, google_login_succes
from .two_factor_start import TwoFactorStartView
from .two_factor_verify import TwoFactorVerifyView
from .two_factor_login import TwoFactorLoginView

__all__ = [
    'UserView',
    'RegisterView',
    'LoginView',
    'LogoutView',
    'MeView',
    'GoogleAuthView',
    'google_login_succes',
    'TwoFactorStartView',
    'TwoFactorVerifyView',
    'TwoFactorLoginView',
]

