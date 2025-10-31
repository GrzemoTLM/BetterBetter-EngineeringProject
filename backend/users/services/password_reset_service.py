import random
import requests
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

from users.models import PasswordResetToken

logger = logging.getLogger(__name__)

User = get_user_model()

class PasswordResetService:
    CODE_TTL_MINUTES = 15

    @classmethod
    def reset_request(cls, email: str):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return False

        token = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=cls.CODE_TTL_MINUTES)
        PasswordResetToken.objects.create(user=user, token=token, expires_at=expires_at)
        cls._send_reset_email(user.email, token)

    @classmethod
    def confirm_reset(cls, email: str, code: str, new_password: str) -> bool:
        try:
            user = User.objects.get(email=email)
            reset_token = PasswordResetToken.objects.get(
                user=user,
                token=code,
                used=False
            )
        except (User.DoesNotExist, PasswordResetToken.DoesNotExist):
            return False

        if reset_token.expires_at < timezone.now():
            return False

        user.set_password(new_password)
        user.save()
        reset_token.used = True
        reset_token.save()
        return True

    @classmethod
    def _send_reset_email(cls, to_email: str, code: str):
        if settings.DEBUG:
            logger.info(f"[DEV MODE] Password reset email for {to_email}: code={code}")
            logger.info(f"[DEV MODE] Body: Your password reset code is: {code}. Valid for {cls.CODE_TTL_MINUTES} minutes.")
            return True

        url = "https://api.mailersend.com/v1/email"
        data = {
            "from": {"email": settings.DEFAULT_FROM_EMAIL, "name": "BetBetter"},
            "to": [{"email": to_email}],
            "subject": "BetBetter - password reset code",
            "text": f"Your password reset code is: {code}. It is valid for {cls.CODE_TTL_MINUTES} minutes.",
        }
        headers = {
            "Authorization": f"Bearer {settings.MAILERSEND_API_TOKEN}",
            "Content-Type": "application/json",
        }
        try:
            logger.info(f"Sending password reset email to {to_email}")
            resp = requests.post(url, json=data, headers=headers, timeout=10)
            resp.raise_for_status()
            logger.info(f"Password reset email sent to {to_email}. Status: {resp.status_code}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error while sending email: {e}")
            return False
