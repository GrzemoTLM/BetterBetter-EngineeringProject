import random
import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings

from users.models import PasswordResetToken
from users.services.mailersend_service import MailerSendClient

logger = logging.getLogger(__name__)

User = get_user_model()

class PasswordResetService:
    CODE_TTL_MINUTES = 15

    @classmethod
    def reset_request(cls, email: str):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

        token = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=cls.CODE_TTL_MINUTES)
        PasswordResetToken.objects.create(user=user, token=token, expires_at=expires_at)
        sent = cls._send_reset_email(user.email, token)
        return True if sent else False

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
        try:
            client = MailerSendClient()
        except ValueError as e:
            logger.error(f"MailerSendClient initialization error: {e}")
            return False

        subject = "BetBetter - password reset code"
        text = f"Your password reset code is: {code}. It is valid for {cls.CODE_TTL_MINUTES} minutes."
        html = f"<p>{text}</p>"

        try:
            logger.info(f"Sending password reset email to {to_email}")
            result = client.send_email(
                to_email=to_email,
                subject=subject,
                html=html,
                text=text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                from_name="BetBetter",
            )
            if not result.get("ok"):
                logger.error(f"Password reset email not accepted by MailerSend: {result}")
                return False
            logger.info(f"Password reset email sent to {to_email}. Status: {result.get('status_code')}")
            return True
        except Exception as e:
            logger.error(f"Unexpected error while sending email via MailerSend: {e}")
            return False
