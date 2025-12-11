import uuid
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import UserSettings

User = get_user_model()


class TwoFactorService:

    LOGIN_2FA_CACHE_PREFIX = "login-2fa:"
    LOGIN_2FA_TTL = 300

    @staticmethod
    def start_2fa_setup(user: User, method: str) -> dict:
        if method not in ['totp', 'none']:
            raise ValueError('Invalid 2FA method')

        try:
            settings = UserSettings.objects.get(user=user)
        except UserSettings.DoesNotExist:
            raise ValueError('User settings not found')

        if method == 'none':
            TOTPDevice.objects.filter(user=user).delete()
            settings.two_factor_enabled = False
            settings.save()
            return {'detail': 'Two-factor authentication disabled'}

        if settings.two_factor_enabled:
            raise ValueError('2FA already enabled')

        TOTPDevice.objects.filter(user=user).delete()

        if method == 'totp':
            device = TOTPDevice.objects.create(
                user=user,
                confirmed=False,
                name='mobile_app_device'
            )
            settings.save()
            return {'otp_uri': device.config_url}

    @staticmethod
    def verify_2fa_setup(user: User, code: str) -> dict:
        if not code:
            raise ValueError('Code is required')

        try:
            settings = UserSettings.objects.get(user=user)
        except UserSettings.DoesNotExist:
            raise ValueError('User settings not found')

        method = 'totp'
        if method not in ['totp']:
            raise ValueError('2FA method not set. Start setup first.')

        if settings.two_factor_enabled:
            return {'detail': '2FA already enabled'}

        if method == 'totp':
            device = TOTPDevice.objects.filter(
                user=user,
                name='mobile_app_device'
            ).first()
            if not device:
                device = TOTPDevice.objects.filter(user=user).first()
            if not device:
                raise ValueError('TOTP device not found. Start setup again.')

            if not device.verify_token(code):
                raise ValueError('Invalid code')

            if not device.confirmed:
                device.confirmed = True
                device.save()

        settings.two_factor_enabled = True
        settings.save()
        return {'detail': f'Successfully verified (totp)'}

    @staticmethod
    def create_2fa_login_challenge(user: User, method: str) -> str:
        challenge_id = str(uuid.uuid4())
        cache.set(
            f"{TwoFactorService.LOGIN_2FA_CACHE_PREFIX}{challenge_id}",
            {"user_id": user.id, "method": method},
            timeout=TwoFactorService.LOGIN_2FA_TTL,
        )

        return challenge_id

    @staticmethod
    def verify_2fa_login_challenge(challenge_id: str, code: str) -> User:
        cached = cache.get(
            TwoFactorService.LOGIN_2FA_CACHE_PREFIX + challenge_id
        )
        if not cached:
            raise ValueError('Invalid challenge ID')

        user_id = cached.get('user_id')
        method = cached.get('method')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValueError('Invalid user ID')

        if method == "totp":
            device = TOTPDevice.objects.filter(
                user=user,
                name='mobile_app_device'
            ).first()
            if not device:
                device = TOTPDevice.objects.filter(user=user).first()
            if not device or not device.verify_token(code):
                raise ValueError('Invalid code')
        else:
            raise ValueError('Invalid method')

        cache.delete(TwoFactorService.LOGIN_2FA_CACHE_PREFIX + challenge_id)

        return user

