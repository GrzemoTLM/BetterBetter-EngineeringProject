from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class GoogleAuthService:

    @staticmethod
    def verify_google_token(token: str) -> dict:
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            email = idinfo.get("email")
            name = idinfo.get("name")

            if not email:
                raise ValueError("No email in Google account")

            return {
                "email": email,
                "name": name,
            }
        except ValueError as e:
            raise ValueError(f"Invalid or expired Google token: {str(e)}")

    @staticmethod
    def get_or_create_google_user(email: str, name: str) -> tuple:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": name or email.split("@")[0],
            }
        )
        return user, created

    @staticmethod
    def authenticate_with_google(token: str) -> dict:
        google_info = GoogleAuthService.verify_google_token(token)
        
        user, created = GoogleAuthService.get_or_create_google_user(
            google_info["email"],
            google_info["name"]
        )
        
        refresh = RefreshToken.for_user(user)
        
        return {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "new_user": created,
        }

