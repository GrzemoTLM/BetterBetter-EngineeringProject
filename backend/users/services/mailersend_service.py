import os
from typing import Optional
from mailersend import MailerSendClient as MSClient, EmailBuilder

MAILERSEND_API_KEY = os.getenv("MAILERSEND_API_KEY")


class MailerSendClient:

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or MAILERSEND_API_KEY
        if not self.api_key:
            raise ValueError("Brak MAILERSEND_API_KEY w konfiguracji środowiska")

        self.client = MSClient(api_key=self.api_key)

    def send_email(
        self,
        to_email: str,
        subject: str,
        html: str,
        text: str,
        from_email: str,
        from_name: str = "BetBetter"
    ) -> dict:

        try:
            email = (EmailBuilder()
                     .from_email(from_email, from_name)
                     .to_many([{"email": to_email}])
                     .subject(subject)
                     .html(html)
                     .text(text)
                     .build())

            response = self.client.emails.send(email)
            message_id = None
            if hasattr(response, 'body') and isinstance(response.body, dict):
                message_id = response.body.get('message_id')
            elif hasattr(response, 'message_id'):
                message_id = response.message_id

            return {
                "status_code": response.status_code if hasattr(response, 'status_code') else 200,
                "ok": True,
                "message_id": message_id,
                "data": {"message_id": message_id}
            }
        except Exception as e:
            return {
                "status_code": 500,
                "ok": False,
                "error": str(e),
                "data": None
            }
