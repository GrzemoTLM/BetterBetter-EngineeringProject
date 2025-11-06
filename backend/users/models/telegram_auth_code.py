from django.db import models
from django.conf import settings
from django.utils import timezone
import secrets


class TelegramAuthCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='telegram_auth_codes'
    )
    code = models.CharField(max_length=20, unique=True, db_index=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'users_telegram_auth_code'
        verbose_name = 'Telegram Auth Code'
        verbose_name_plural = 'Telegram Auth Codes'

    def __str__(self):
        return f"{self.code} - {self.user.username} - {'Used' if self.is_used else 'Active'}"

    @staticmethod
    def generate_code(user, expires_hours=1):
        from datetime import timedelta
        code = secrets.token_hex(6).upper()
        expires_at = timezone.now() + timedelta(hours=expires_hours)
        auth_code = TelegramAuthCode.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
        return code

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

