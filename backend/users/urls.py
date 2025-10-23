from django.urls import path, include
from rest_framework import routers
from .viewsLoginRegister import UserView, RegisterView, LoginView, LogoutView, MeView, GoogleAuthView
from .views2FA import TwoFactorStartView, TwoFactorVerifyView, TwoFactorLoginView

router = routers.DefaultRouter()
router.register(r'users', UserView, basename='user')
urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('auth/login/verify-2fa/', TwoFactorLoginView.as_view(), name='login_verify_2fa'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('me/', MeView.as_view(), name='user-me'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('two-factor/start/', TwoFactorStartView.as_view(), name='two_factor_start'),
    path('two-factor/verify/', TwoFactorVerifyView.as_view(), name='two_factor_verify'),
]