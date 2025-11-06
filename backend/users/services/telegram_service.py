from users.models import TelegramAuthCode, TelegramUser
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class TelegramService:

    @staticmethod
    def generate_auth_code(user: User) -> TelegramAuthCode:
        code = TelegramAuthCode.generate_code(user)
        return TelegramAuthCode.objects.get(code=code)

    @staticmethod
    def connect_telegram(user: User, telegram_id: int, code: str) -> TelegramUser:
        try:
            auth_code = TelegramAuthCode.objects.get(
                code=code,
                is_used=False,
                user=user
            )
            if not auth_code.is_valid():
                raise serializers.ValidationError("Code expired")
        except TelegramAuthCode.DoesNotExist:
            raise serializers.ValidationError("Invalid code")

        telegram_user, created = TelegramUser.objects.get_or_create(
            telegram_id=telegram_id,
            defaults={'user': user}
        )

        if not created and telegram_user.user != user:
            raise serializers.ValidationError(
                "Telegram account is already connected to another user"
            )

        auth_code.is_used = True
        auth_code.save()

        return telegram_user

    @staticmethod
    def get_telegram_user(user: User) -> TelegramUser:
        try:
            return TelegramUser.objects.get(user=user)
        except TelegramUser.DoesNotExist:
            raise serializers.ValidationError("Telegram account not connected")

    @staticmethod
    def disconnect_telegram(user: User) -> bool:
        try:
            telegram_user = TelegramUser.objects.get(user=user)
            telegram_user.delete()
            return True
        except TelegramUser.DoesNotExist:
            return False

    @staticmethod
    def get_user_by_telegram_id(telegram_id: int) -> User:
        try:
            telegram_user = TelegramUser.objects.get(telegram_id=telegram_id)
            return telegram_user.user
        except TelegramUser.DoesNotExist:
            raise ValueError("Telegram user not found")

    @staticmethod
    def update_username(telegram_user: TelegramUser, new_username: str) -> None:
        if new_username and new_username != telegram_user.telegram_username:
            telegram_user.telegram_username = new_username
            telegram_user.save(update_fields=['telegram_username'])

    @staticmethod
    def login_via_code(telegram_id: int, telegram_username: str, code: str) -> TelegramUser:
        try:
            auth_code = TelegramAuthCode.objects.get(
                code=code,
                is_used=False
            )

            if not auth_code.is_valid():
                raise ValueError("Code expired or already used")

            telegram_user, created = TelegramUser.objects.get_or_create(
                telegram_id=telegram_id,
                defaults={
                    'telegram_username': telegram_username or '',
                    'user': auth_code.user
                }
            )

            if not created and telegram_user.user != auth_code.user:
                raise ValueError("Telegram account is already connected to another user")

            if telegram_username:
                TelegramService.update_username(telegram_user, telegram_username)

            auth_code.is_used = True
            auth_code.save(update_fields=['is_used'])

            return telegram_user

        except TelegramAuthCode.DoesNotExist:
            raise ValueError("Invalid code")
