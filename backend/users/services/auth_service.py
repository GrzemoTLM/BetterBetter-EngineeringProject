from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthService:

    @staticmethod
    def register_user(username: str, email: str, password: str) -> User:
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password)
        )
        return user

    @staticmethod
    def authenticate_user(email: str, password: str) -> User:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValueError("Invalid credentials")
        
        authenticated_user = authenticate(username=user.username, password=password)
        if not authenticated_user:
            raise ValueError("Invalid credentials")
        
        if not authenticated_user.is_active:
            raise ValueError("User is not active")
        
        return authenticated_user

    @staticmethod
    def generate_tokens(user: User) -> dict:
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

