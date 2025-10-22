from django.core.cache import cache
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.plugins.otp_email.models import EmailDevice
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserSettings
from .serializers import LoginSerializer, UserSerializer
from .viewsLoginRegister import LoginView

User = get_user_model()


class TwoFactorStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        method = (request.data.get('method') or '').strip().lower()

        if method not in ['totp', 'email', 'none']:
            return Response({'error': 'Invalid 2FA method'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            settings = UserSettings.objects.get(user=user)
        except UserSettings.DoesNotExist:
            return Response({'error': 'User settings not found'},
                            status=status.HTTP_404_NOT_FOUND)

        if method == 'none':
            EmailDevice.objects.filter(user=user).delete()
            TOTPDevice.objects.filter(user=user).delete()
            settings.two_factor_method = None
            settings.two_factor_enabled = False
            settings.save()
            return Response({'detail': 'Two-factor authentication disabled'},
                            status=status.HTTP_200_OK)

        if settings.two_factor_enabled:
            return Response({'error': '2FA already enabled'},
                            status=status.HTTP_400_BAD_REQUEST)

        EmailDevice.objects.filter(user=user).delete()
        TOTPDevice.objects.filter(user=user).delete()

        if method == 'totp':
            device = TOTPDevice.objects.create(user=user,
                                        confirmed=False,
                                        name='mobile_app_device')
            otp_uri = device.config_url
            settings.two_factor_method = 'totp'
            settings.save()
            return Response({'otp_uri': otp_uri},
                            status=status.HTTP_200_OK)

        elif method == 'email':
            device = EmailDevice.objects.create(user=user,
                                        confirmed=True,
                                        name='email_device')
            device.generate_challenge()
            settings.two_factor_method = 'email'
            settings.save()
            return Response({'detail': 'Verification code sent to your email'},
                            status=status.HTTP_200_OK)

        return Response({'error': 'Invalid 2FA method'},
                        status=status.HTTP_400_BAD_REQUEST)


class TwoFactorVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = str(request.data.get('code') or '').strip()
        if not code:
            return Response({'error': 'Code is required'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            settings = UserSettings.objects.get(user=user)
        except UserSettings.DoesNotExist:
            return Response({'error': 'User settings not found'},
                            status=status.HTTP_404_NOT_FOUND)

        method = (settings.two_factor_method or '').lower()
        if method not in ['totp', 'email']:
            return Response({'error': '2FA method not set. Start setup first.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if settings.two_factor_enabled:
            return Response({'detail': '2FA already enabled'},
                            status=status.HTTP_200_OK)

        if method == 'totp':
            device = TOTPDevice.objects.filter(user=user, name='mobile_app_device').first()
            if not device:
                device = TOTPDevice.objects.filter(user=user).first()
            if not device:
                return Response({'error': 'TOTP device not found. Start setup again.'},
                                status=status.HTTP_400_BAD_REQUEST)

            if not device.verify_token(code):
                return Response({'error': 'Invalid code'},
                                status=status.HTTP_400_BAD_REQUEST)

            if not device.confirmed:
                device.confirmed = True
                device.save()

            settings.two_factor_enabled = True
            settings.save()
            return Response({'detail': 'Successfully verified (TOTP)'},
                            status=status.HTTP_200_OK)

        elif method == 'email':
            device = EmailDevice.objects.filter(user=user,
                                        name='email_device').first()
            if not device:
                device = EmailDevice.objects.filter(user=user).first()
            if not device:
                return Response({'error': 'Email device not found. Start setup again.'},
                                status=status.HTTP_400_BAD_REQUEST)

            if not device.verify_token(code):
                return Response({'error': 'Invalid code'},
                                status=status.HTTP_400_BAD_REQUEST)

            settings.two_factor_enabled = True
            settings.save()
            return Response({'detail': 'Successfully verified (email)'},
                            status=status.HTTP_200_OK)

        return Response({'error': 'Invalid 2FA method'},
                        status=status.HTTP_400_BAD_REQUEST)


class TwoFactorLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        challenge_id = str(request.data.get('challenge_id') or "").strip()
        code = str(request.data.get('code') or "").strip()
        if not challenge_id or not code:
            return Response({'error': 'Challenge ID and code are required'},
                            status=status.HTTP_400_BAD_REQUEST)
        cached = cache.get(LoginView.LOGIN_2FA_CACHE_PREFIX + challenge_id)
        if not cached:
            return Response({'error': 'Invalid challenge ID'},
                            status=status.HTTP_400_BAD_REQUEST)

        user_id = cached.get('user_id')
        method = cached.get('method')
        UserModel = get_user_model()

        try:
            user = UserModel.objects.get(id=user_id)
        except UserModel.DoesNotExist:
            return Response({'error': 'Invalid user ID'},
                            status=status.HTTP_400_BAD_REQUEST)

        if method == "totp":
            device = TOTPDevice.objects.filter(user=user, name='mobile_app_device').first()
            if not device:
                device = TOTPDevice.objects.filter(user=user).first()
            if not device or not device.verify_token(code):
                return Response({'error': 'Invalid code'},
                                status=status.HTTP_400_BAD_REQUEST)

        elif method == "email":
            device = EmailDevice.objects.filter(user=user, name='email_device').first()
            if not device:
                device = EmailDevice.objects.filter(user=user).first()
            if not device or not device.verify_token(code):
                return Response({'error': 'Invalid code'},
                                status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response({'error': 'Invalid method'},
                            status=status.HTTP_400_BAD_REQUEST)

        cache.delete(LoginView.LOGIN_2FA_CACHE_PREFIX + challenge_id)

        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_200_OK)







